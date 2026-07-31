import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withRole } from '../_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'
import { supabaseAdmin } from '../_lib/utils/supabaseAdmin.js'
import {
  userBanSchema,
  userRoleUpdateSchema,
  userStatusUpdateSchema,
} from '../_lib/validators/user.js'
import { logAdminAction } from '../_lib/utils/auditLog.js'
import { syncAuthBanState } from '../_lib/utils/authBan.js'
import { isValidUuid } from '../_lib/utils/validateId.js'

// '/api/users' itself lives in ../users.ts. See api/events/[id].ts for why
// this is a single dynamic segment with a `?action=` query param for
// sub-actions rather than a required catch-all (`[...segments].ts`) —
// the catch-all was unreliable in production (reproducible 404s on paths
// it should have matched). Every route here is ADMIN-only, so withRole
// wraps the whole dispatcher once.
function getId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

function getAction(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.action) ? req.query.action[0] : req.query.action
}

export default withRole(['ADMIN'], async (req, res, user) => {
  const id = getId(req)
  if (!id) {
    sendError(res, 'Missing user id', 400)
    return
  }
  if (!isValidUuid(id)) {
    sendError(res, 'User not found', 404)
    return
  }
  const action = getAction(req)

  if (!action) {
    if (req.method === 'GET') {
      await handleGet(id, res)
      return
    }
    if (req.method === 'DELETE') {
      await handleDelete(id, res, user.id)
      return
    }
    sendError(res, 'Method not allowed', 405)
    return
  }

  if (action === 'ban') {
    if (req.method !== 'POST') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await handleBan(id, req, res, user.id)
    return
  }

  if (action === 'status') {
    if (req.method !== 'PATCH') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await handleStatus(id, req, res, user.id)
    return
  }

  if (action === 'role') {
    if (req.method !== 'PATCH') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await handleRole(id, req, res, user.id)
    return
  }

  sendError(res, 'Not found', 404)
})

// --- /api/users/:id ------------------------------------------------------------

// GET /api/users/:id — full detail: user + member profile + registrations
// (+ ban history, useful context next to the ban/status actions on the
// same admin page).
async function handleGet(id: string, res: VercelResponse): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberProfile: true,
      eventRegistrations: { include: { event: true }, orderBy: { registeredAt: 'desc' } },
      bans: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!user) {
    sendError(res, 'User not found', 404)
    return
  }

  sendSuccess(res, user)
}

// DELETE /api/users/:id — ADMIN. Must remove both the Prisma `users` row and
// the actual Supabase Auth account, otherwise one orphans the other.
//
// Order matters: Supabase Auth is deleted FIRST, then the Prisma row.
// If the Prisma delete fails after Auth succeeds, the leftover state is a
// harmless stale `users` row pointing at an Auth account that can no longer
// authenticate (retry-safe, no security exposure). The reverse order is the
// dangerous one: if Prisma succeeds but the Auth call then fails, the
// account keeps a *live, loginable* Supabase session with no app-side user
// row at all — invisible to RBAC/withRole and to this admin list, but still
// able to obtain valid tokens. So Auth-first is the safer failure mode.
//
// `events.created_by`, `bans.created_by`, and `audit_logs.admin_id` are all
// ON DELETE RESTRICT — any admin who has ever created an event, issued a
// ban, or performed a logged action (which is virtually every admin who's
// actually used the panel) will hit that constraint on the Prisma delete.
// That's checked for up front, before the irreversible Auth deletion, so
// this fails cleanly with a 409 instead of destroying the login credential
// and then discovering the DB row can't follow it.
async function handleDelete(id: string, res: VercelResponse, adminId: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'User not found', 404)
    return
  }

  const [eventCount, banCount, auditLogCount] = await Promise.all([
    prisma.event.count({ where: { createdBy: id } }),
    prisma.ban.count({ where: { createdBy: id } }),
    prisma.auditLog.count({ where: { adminId: id } }),
  ])
  if (eventCount > 0 || banCount > 0 || auditLogCount > 0) {
    sendError(
      res,
      'Cannot delete a user with recorded admin actions (created events, issued bans, or audit history)',
      409,
    )
    return
  }

  // Logged before either delete completes so the action is on record even
  // if a step below fails partway through — targetId has no FK constraint,
  // so this row stays valid even after the target user disappears.
  await logAdminAction(adminId, 'USER_DELETED', id)

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) {
    sendError(res, `Failed to delete Supabase Auth user: ${authError.message}`, 500)
    return
  }

  try {
    await prisma.user.delete({ where: { id } })
  } catch {
    // TOCTOU backstop: something started referencing this user between the
    // check above and this delete. The Auth account is already gone at
    // this point (documented as the safer failure mode above) — surface a
    // clear error rather than an unhandled 500.
    sendError(res, 'Failed to delete user record after removing their login credential', 500)
    return
  }

  sendSuccess(res, { id })
}

// --- /api/users/:id?action=ban --------------------------------------------------

// POST /api/users/:id?action=ban — ADMIN. Creates a Ban row AND sets status
// to BANNED atomically (a single $transaction — either both writes land or
// neither does, so a user is never left BANNED without a recorded reason,
// or with a Ban row while still ACTIVE).
async function handleBan(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
): Promise<void> {
  const parsed = userBanSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'User not found', 404)
    return
  }

  const [ban] = await prisma.$transaction([
    prisma.ban.create({
      data: { userId: id, reason: parsed.data.reason, createdBy: adminId },
    }),
    prisma.user.update({ where: { id }, data: { status: 'BANNED' } }),
  ])

  await syncAuthBanState(id, 'BANNED')
  await logAdminAction(adminId, 'USER_BANNED', id)

  sendSuccess(res, ban, 201)
}

// --- /api/users/:id?action=status -------------------------------------------------

// PATCH /api/users/:id?action=status — ADMIN. Direct status transition,
// distinct from POST .../?action=ban which additionally records a Ban row
// with a reason. UserStatus only has ACTIVE/PENDING/BANNED
// (prisma/schema.prisma) — no separate "suspended" state.
async function handleStatus(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
): Promise<void> {
  const parsed = userStatusUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'User not found', 404)
    return
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  await syncAuthBanState(id, parsed.data.status)
  await logAdminAction(adminId, 'USER_STATUS_CHANGED', id)

  sendSuccess(res, updated)
}

// --- /api/users/:id?action=role -------------------------------------------------

// PATCH /api/users/:id?action=role — ADMIN. Promotes an adherent to admin or
// demotes an admin back to a regular user. An admin can't change their own
// role through this route — self-service promotion/demotion isn't
// meaningfully auditable (who granted it?) and self-demotion risks locking
// the caller out with no other admin around to undo it.
async function handleRole(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
): Promise<void> {
  if (id === adminId) {
    sendError(res, 'You cannot change your own role', 403)
    return
  }

  const parsed = userRoleUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'User not found', 404)
    return
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
  })

  await logAdminAction(adminId, 'USER_ROLE_CHANGED', id)

  sendSuccess(res, updated)
}

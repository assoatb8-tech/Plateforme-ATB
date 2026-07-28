import type { VercelRequest, VercelResponse } from '../types.js'
import { prisma } from '../utils/prisma.js'
import { withRole, type RoleHandler } from '../middlewares/rbac.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { supabaseAdmin } from '../utils/supabaseAdmin.js'
import { userBanSchema, userStatusUpdateSchema } from '../validators/user.js'
import { logAdminAction } from '../utils/auditLog.js'

const PAGE_SIZE = 20
const STATUS_VALUES = ['ACTIVE', 'PENDING', 'BANNED'] as const
type StatusFilter = (typeof STATUS_VALUES)[number]

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function getSegments(req: VercelRequest): string[] {
  const raw = req.query.segments
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

// See api/events/[[...segments]].ts for why this got consolidated from 4
// files into one — same Vercel Hobby-plan function-count limit. Every
// route here happens to be ADMIN-only, so withRole wraps the whole
// dispatcher once instead of being repeated per branch.
const dispatch: RoleHandler = async (req, res, user) => {
  const segments = getSegments(req)

  if (segments.length === 0) {
    if (req.method === 'GET') {
      await handleList(req, res)
      return
    }
    sendError(res, 'Method not allowed', 405)
    return
  }

  const [id, action] = segments

  if (segments.length === 1) {
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

  if (segments.length === 2 && action === 'ban') {
    if (req.method !== 'POST') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await handleBan(id, req, res, user.id)
    return
  }

  if (segments.length === 2 && action === 'status') {
    if (req.method !== 'PATCH') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await handleStatus(id, req, res, user.id)
    return
  }

  sendError(res, 'Not found', 404)
}

export default withRole(['ADMIN'], dispatch)

// --- /api/users --------------------------------------------------------------

// GET /api/users — ADMIN. Paginated list, searchable by email or member
// full name, filterable by status. Joins MemberProfile for display purposes
// only (fullName/phoneMobile) — full detail lives behind GET /api/users/:id.
async function handleList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const page = Math.max(1, Number(firstParam(req.query.page)) || 1)
  const search = firstParam(req.query.search)?.trim() ?? ''
  const statusParam = firstParam(req.query.status)
  const status: StatusFilter | undefined = STATUS_VALUES.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : undefined

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { memberProfile: { fullName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        memberProfile: { select: { fullName: true, phoneMobile: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  sendSuccess(res, {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      fullName: u.memberProfile?.fullName ?? null,
      phoneMobile: u.memberProfile?.phoneMobile ?? null,
    })),
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

// --- /api/users/:id ------------------------------------------------------------

// GET /api/users/:id — full detail: user + member profile + payment
// history + registrations (+ ban history, useful context next to the
// ban/status actions on the same admin page).
async function handleGet(id: string, res: VercelResponse): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberProfile: true,
      payments: { orderBy: { createdAt: 'desc' } },
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
async function handleDelete(id: string, res: VercelResponse, adminId: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'User not found', 404)
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

  await prisma.user.delete({ where: { id } })

  sendSuccess(res, { id })
}

// --- /api/users/:id/ban --------------------------------------------------------

// POST /api/users/:id/ban — ADMIN. Creates a Ban row AND sets status to
// BANNED atomically (a single $transaction — either both writes land or
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

  await logAdminAction(adminId, 'USER_BANNED', id)

  sendSuccess(res, ban, 201)
}

// --- /api/users/:id/status -------------------------------------------------------

// PATCH /api/users/:id/status — ADMIN. Direct status transition, distinct
// from POST /api/users/:id/ban which additionally records a Ban row with a
// reason. UserStatus only has ACTIVE/PENDING/BANNED (prisma/schema.prisma) —
// no separate "suspended" state.
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

  await logAdminAction(adminId, 'USER_STATUS_CHANGED', id)

  sendSuccess(res, updated)
}

import type { VercelRequest, VercelResponse } from '../types.js'
import { prisma } from '../utils/prisma.js'
import { withRole } from '../middlewares/rbac.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { supabaseAdmin } from '../utils/supabaseAdmin.js'
import { logAdminAction } from '../utils/auditLog.js'

function getUserId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = getUserId(req)
  if (!id) {
    sendError(res, 'Missing user id', 400)
    return
  }

  if (req.method === 'GET') {
    await withRole(['ADMIN'], (_roleReq, roleRes) => handleGet(id, roleRes))(req, res)
    return
  }

  if (req.method === 'DELETE') {
    await withRole(['ADMIN'], (_roleReq, roleRes, user) => handleDelete(id, roleRes, user.id))(
      req,
      res,
    )
    return
  }

  sendError(res, 'Method not allowed', 405)
}

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

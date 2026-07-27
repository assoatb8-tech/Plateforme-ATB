import type { VercelRequest, VercelResponse } from '../../types'
import { prisma } from '../../utils/prisma'
import { withRole } from '../../middlewares/rbac'
import { sendError, sendSuccess } from '../../utils/response'
import { userStatusUpdateSchema } from '../../validators/user'
import { logAdminAction } from '../../utils/auditLog'

function getUserId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

// PATCH /api/users/:id/status — ADMIN. Direct status transition, distinct
// from POST /api/users/:id/ban which additionally records a Ban row with a
// reason. UserStatus only has ACTIVE/PENDING/BANNED (prisma/schema.prisma) —
// no separate "suspended" state.
export default withRole(['ADMIN'], async (req: VercelRequest, res: VercelResponse, user) => {
  if (req.method !== 'PATCH') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const id = getUserId(req)
  if (!id) {
    sendError(res, 'Missing user id', 400)
    return
  }

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

  await logAdminAction(user.id, 'USER_STATUS_CHANGED', id)

  sendSuccess(res, updated)
})

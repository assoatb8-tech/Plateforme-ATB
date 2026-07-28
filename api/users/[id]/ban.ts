import type { VercelRequest, VercelResponse } from '../../types.js'
import { prisma } from '../../utils/prisma.js'
import { withRole } from '../../middlewares/rbac.js'
import { sendError, sendSuccess } from '../../utils/response.js'
import { userBanSchema } from '../../validators/user.js'
import { logAdminAction } from '../../utils/auditLog.js'

function getUserId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

// POST /api/users/:id/ban — ADMIN. Creates a Ban row AND sets status to
// BANNED atomically (a single $transaction — either both writes land or
// neither does, so a user is never left BANNED without a recorded reason,
// or with a Ban row while still ACTIVE).
export default withRole(['ADMIN'], async (req: VercelRequest, res: VercelResponse, user) => {
  if (req.method !== 'POST') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const id = getUserId(req)
  if (!id) {
    sendError(res, 'Missing user id', 400)
    return
  }

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
      data: { userId: id, reason: parsed.data.reason, createdBy: user.id },
    }),
    prisma.user.update({ where: { id }, data: { status: 'BANNED' } }),
  ])

  await logAdminAction(user.id, 'USER_BANNED', id)

  sendSuccess(res, ban, 201)
})

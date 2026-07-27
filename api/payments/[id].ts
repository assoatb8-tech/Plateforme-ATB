import type { VercelRequest, VercelResponse } from '../types'
import { prisma } from '../utils/prisma'
import { withRole } from '../middlewares/rbac'
import { sendError, sendSuccess } from '../utils/response'
import { paymentStatusUpdateSchema } from '../validators/payment'
import { logAdminAction } from '../utils/auditLog'

function getPaymentId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

// PATCH /api/payments/:id — ADMIN. Validates or rejects a cotisation.
export default withRole(['ADMIN'], async (req: VercelRequest, res: VercelResponse, user) => {
  if (req.method !== 'PATCH') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const id = getPaymentId(req)
  if (!id) {
    sendError(res, 'Missing payment id', 400)
    return
  }

  const parsed = paymentStatusUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const existing = await prisma.payment.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'Payment not found', 404)
    return
  }

  // Guard against double-validation races: two admins hitting PATCH on the
  // same PENDING payment at once, or a stale UI resubmitting after another
  // admin already acted. The conditional `status: 'PENDING'` filter makes
  // only one PATCH actually match a row — updateMany returns count 0 for
  // the loser instead of silently overwriting validatedBy/validatedAt with
  // whoever's request happened to run last.
  const { count } = await prisma.payment.updateMany({
    where: { id, status: 'PENDING' },
    data: {
      status: parsed.data.status,
      validatedBy: user.id,
      validatedAt: new Date(),
    },
  })

  if (count === 0) {
    sendError(res, 'Payment already processed', 409)
    return
  }

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id } })

  await logAdminAction(
    user.id,
    parsed.data.status === 'VALIDATED' ? 'PAYMENT_VALIDATED' : 'PAYMENT_REJECTED',
    id,
  )

  sendSuccess(res, payment)
})

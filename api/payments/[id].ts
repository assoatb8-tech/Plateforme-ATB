import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withRole } from '../_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'
import { paymentStatusUpdateSchema } from '../_lib/validators/payment.js'
import { logAdminAction } from '../_lib/utils/auditLog.js'

// '/api/payments' itself lives in ../payments.ts. Single dynamic segment
// rather than a required catch-all (`[...segments].ts`) — see
// api/events/[id].ts for why: the catch-all form was unreliable in
// production even for this single-segment case (reproducible "Not found"
// on a path it should have matched).
function getId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

export default withRole(['ADMIN'], async (req, res, user) => {
  const id = getId(req)
  if (!id) {
    sendError(res, 'Missing payment id', 400)
    return
  }

  if (req.method !== 'PATCH') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  await handleUpdateStatus(id, req, res, user.id)
})

// PATCH /api/payments/:id — ADMIN. Validates or rejects a cotisation.
async function handleUpdateStatus(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
): Promise<void> {
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
      validatedBy: adminId,
      validatedAt: new Date(),
    },
  })

  if (count === 0) {
    sendError(res, 'Payment already processed', 409)
    return
  }

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id } })

  await logAdminAction(
    adminId,
    parsed.data.status === 'VALIDATED' ? 'PAYMENT_VALIDATED' : 'PAYMENT_REJECTED',
    id,
  )

  sendSuccess(res, payment)
}

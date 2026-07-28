import type { VercelRequest, VercelResponse } from '../types.js'
import { prisma } from '../utils/prisma.js'
import { withRole } from '../middlewares/rbac.js'
import { sendError, sendSuccess } from '../utils/response.js'

// GET /api/admin/stats — ADMIN. FEATURES.md "Dashboard administrateur":
// total adherents, new adherents (last 30 days), active events, total
// registrations, pending payments. All five counts run in parallel
// (Promise.all) rather than sequentially to keep this a single round trip
// of independent COUNT queries instead of N+1.
export default withRole(['ADMIN'], async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [totalMembers, newMembers, activeEvents, totalRegistrations, pendingPayments] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.event.count({ where: { status: 'ACTIVE' } }),
      prisma.eventRegistration.count({ where: { status: 'REGISTERED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
    ])

  sendSuccess(res, {
    totalMembers,
    newMembers,
    activeEvents,
    totalRegistrations,
    pendingPayments,
  })
})

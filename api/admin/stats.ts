import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withRole } from '../_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'

// GET /api/admin/stats — ADMIN. FEATURES.md "Dashboard administrateur":
// total adherents, new adherents (last 30 days), active events, total
// registrations. All four counts run in parallel (Promise.all) rather than
// sequentially to keep this a single round trip of independent COUNT
// queries instead of N+1.
export default withRole(['ADMIN'], async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [totalMembers, newMembers, activeEvents, totalRegistrations] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.event.count({ where: { status: 'ACTIVE' } }),
    prisma.eventRegistration.count({ where: { status: 'REGISTERED' } }),
  ])

  sendSuccess(res, {
    totalMembers,
    newMembers,
    activeEvents,
    totalRegistrations,
  })
})

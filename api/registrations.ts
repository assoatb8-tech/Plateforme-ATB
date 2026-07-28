import type { VercelRequest, VercelResponse } from './types.js'
import { prisma } from './utils/prisma.js'
import { withAuth } from './middlewares/auth.js'
import { sendError, sendSuccess } from './utils/response.js'

// Not listed in API.md's "Registration API" section, which only covers
// per-event register/cancel/participants routes. Added for the "Mes
// participations" page (FEATURES.md), which needs a single owner-scoped
// listing across all events rather than one lookup per event. Mirrors the
// RLS "event_registrations_select" policy: a user only ever sees their own
// rows here (never another adherent's — enforced by the userId filter, not
// left to the client).
export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: user.id, status: { in: ['REGISTERED', 'WAITING_LIST'] } },
    orderBy: { event: { startDate: 'asc' } },
    include: { event: true },
  })

  sendSuccess(res, registrations)
})

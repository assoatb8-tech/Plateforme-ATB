import type { VercelRequest, VercelResponse } from '../../types'
import { prisma } from '../../utils/prisma'
import { withRole } from '../../middlewares/rbac'
import { sendError, sendSuccess } from '../../utils/response'

function getEventId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

export default withRole(['ADMIN'], async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const eventId = getEventId(req)
  if (!eventId) {
    sendError(res, 'Missing event id', 400)
    return
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) {
    sendError(res, 'Event not found', 404)
    return
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId },
    orderBy: { registeredAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          memberProfile: { select: { fullName: true, phoneMobile: true } },
        },
      },
    },
  })

  sendSuccess(res, registrations)
})

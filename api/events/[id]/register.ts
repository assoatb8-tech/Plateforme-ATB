import { Prisma } from '@prisma/client'
import type { VercelRequest, VercelResponse } from '../../types.js'
import { prisma } from '../../utils/prisma.js'
import { withAuth, type AuthedUser } from '../../middlewares/auth.js'
import { sendError, sendSuccess } from '../../utils/response.js'

function getEventId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

// Thrown from inside the transaction when the caller already holds an
// active registration — caught outside and translated to a clean 409,
// distinct from the DB-level unique constraint race (also 409) that can
// happen if two requests for the same never-registered user land at once.
class AlreadyRegisteredError extends Error {}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  const eventId = getEventId(req)
  if (!eventId) {
    sendError(res, 'Missing event id', 400)
    return
  }

  if (req.method === 'POST') {
    await handleRegister(eventId, user, res)
    return
  }

  if (req.method === 'DELETE') {
    await handleCancel(eventId, user, res)
    return
  }

  sendError(res, 'Method not allowed', 405)
})

async function handleRegister(
  eventId: string,
  user: AuthedUser,
  res: VercelResponse,
): Promise<void> {
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) {
    sendError(res, 'Event not found', 404)
    return
  }
  if (event.status !== 'ACTIVE') {
    sendError(res, 'This event is not open for registration', 400)
    return
  }

  try {
    // Capacity check + write happen inside a transaction so two concurrent
    // registrations can't both read "1 spot left" and both get REGISTERED.
    const registration = await prisma.$transaction(async (tx) => {
      const existing = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId: user.id } },
      })

      if (existing && existing.status !== 'CANCELLED') {
        throw new AlreadyRegisteredError()
      }

      const activeCount = await tx.eventRegistration.count({
        where: { eventId, status: 'REGISTERED' },
      })
      // maxParticipants exceeded server-side (never trust a frontend check)
      // -> waitlist instead of a hard rejection, per RegistrationStatus enum.
      const status = activeCount < event.maxParticipants ? 'REGISTERED' : 'WAITING_LIST'

      return existing
        ? tx.eventRegistration.update({
            where: { id: existing.id },
            data: { status, registeredAt: new Date() },
          })
        : tx.eventRegistration.create({ data: { eventId, userId: user.id, status } })
    })

    sendSuccess(res, registration, 201)
  } catch (error) {
    if (error instanceof AlreadyRegisteredError || isUniqueConstraintError(error)) {
      sendError(res, 'You are already registered for this event', 409)
      return
    }
    throw error
  }
}

async function handleCancel(eventId: string, user: AuthedUser, res: VercelResponse): Promise<void> {
  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  })

  if (!existing || existing.status === 'CANCELLED') {
    sendError(res, 'Registration not found', 404)
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventRegistration.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' },
    })

    // A REGISTERED spot just opened up: promote the longest-waiting person
    // on the waiting list, if any, rather than leaving the seat empty.
    if (existing.status === 'REGISTERED') {
      const nextWaiting = await tx.eventRegistration.findFirst({
        where: { eventId, status: 'WAITING_LIST' },
        orderBy: { registeredAt: 'asc' },
      })
      if (nextWaiting) {
        await tx.eventRegistration.update({
          where: { id: nextWaiting.id },
          data: { status: 'REGISTERED' },
        })
      }
    }
  })

  sendSuccess(res, { status: 'CANCELLED' })
}

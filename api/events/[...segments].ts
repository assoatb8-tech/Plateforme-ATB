import { Prisma } from '@prisma/client'
import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withRole } from '../_lib/middlewares/rbac.js'
import { withAuth, getOptionalUser, type AuthedUser } from '../_lib/middlewares/auth.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'
import { eventUpdateSchema } from '../_lib/validators/event.js'
import { serializeEvent } from '../_lib/utils/eventSerializer.js'
import { logAdminAction } from '../_lib/utils/auditLog.js'

// '/api/events' itself lives in ../events.ts (see that file for why: a
// required catch-all here can't match the zero-segment base path — Vercel's
// plain, non-Next.js Functions don't support the optional [[...]] form the
// way Next.js does, confirmed by a live 404 on GET /api/events despite every
// local check passing). This file owns everything with at least one path
// segment after /api/events/.
function getSegments(req: VercelRequest): string[] {
  const raw = req.query.segments
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const segments = getSegments(req)
  const [id, action] = segments

  if (segments.length === 1) {
    if (req.method === 'GET') {
      await handleGet(id, req, res)
      return
    }
    if (req.method === 'PATCH') {
      await withRole(['ADMIN'], (roleReq, roleRes, user) =>
        handleUpdate(id, roleReq, roleRes, user.id),
      )(req, res)
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
    return
  }

  if (segments.length === 2 && action === 'register') {
    await withAuth(async (authReq, authRes, user) => {
      if (authReq.method === 'POST') {
        await handleRegister(id, user, authRes)
        return
      }
      if (authReq.method === 'DELETE') {
        await handleCancel(id, user, authRes)
        return
      }
      sendError(authRes, 'Method not allowed', 405)
    })(req, res)
    return
  }

  if (segments.length === 2 && action === 'participants') {
    if (req.method !== 'GET') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await withRole(['ADMIN'], (_roleReq, roleRes) => handleParticipants(id, roleRes))(req, res)
    return
  }

  sendError(res, 'Not found', 404)
}

// --- /api/events/:id ---------------------------------------------------------

async function handleGet(id: string, req: VercelRequest, res: VercelResponse): Promise<void> {
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) {
    sendError(res, 'Event not found', 404)
    return
  }

  const [registeredCount, user] = await Promise.all([
    prisma.eventRegistration.count({ where: { eventId: id, status: 'REGISTERED' } }),
    getOptionalUser(req),
  ])

  const myRegistration = user
    ? await prisma.eventRegistration.findUnique({
        where: { eventId_userId: { eventId: id, userId: user.id } },
      })
    : null

  sendSuccess(res, serializeEvent({ ...event, registeredCount }, myRegistration?.status ?? null))
}

async function handleUpdate(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
): Promise<void> {
  const parsed = eventUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'Event not found', 404)
    return
  }

  const { startDate, endDate, ...rest } = parsed.data
  const event = await prisma.event.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
    },
  })

  await logAdminAction(adminId, 'EVENT_UPDATED', id)

  const registeredCount = await prisma.eventRegistration.count({
    where: { eventId: id, status: 'REGISTERED' },
  })

  sendSuccess(res, serializeEvent({ ...event, registeredCount }, null))
}

async function handleDelete(id: string, res: VercelResponse, adminId: string): Promise<void> {
  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'Event not found', 404)
    return
  }

  await prisma.event.delete({ where: { id } })
  await logAdminAction(adminId, 'EVENT_DELETED', id)
  sendSuccess(res, { id })
}

// --- /api/events/:id/register ------------------------------------------------

// Thrown from inside the transaction when the caller already holds an
// active registration — caught outside and translated to a clean 409,
// distinct from the DB-level unique constraint race (also 409) that can
// happen if two requests for the same never-registered user land at once.
class AlreadyRegisteredError extends Error {}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

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

// --- /api/events/:id/participants --------------------------------------------

async function handleParticipants(eventId: string, res: VercelResponse): Promise<void> {
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
}

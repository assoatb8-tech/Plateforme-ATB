import { Prisma } from '@prisma/client'
import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withRole } from '../_lib/middlewares/rbac.js'
import { withAuth, getOptionalUser, type AuthedUser } from '../_lib/middlewares/auth.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'
import { eventUpdateSchema } from '../_lib/validators/event.js'
import { serializeEvent } from '../_lib/utils/eventSerializer.js'
import { logAdminAction } from '../_lib/utils/auditLog.js'
import { enforceIpRateLimit } from '../_lib/utils/rateLimit.js'
import { isValidUuid } from '../_lib/utils/validateId.js'

// '/api/events' itself lives in ../events.ts.
//
// This used to be a required catch-all (`[...segments].ts`) covering
// '/api/events/:id', '/api/events/:id/register' and
// '/api/events/:id/participants' by parsing req.query.segments. In
// production that was unreliable: GET /api/events/:id came back with our
// own "Not found" (meaning the function WAS invoked, but req.query.segments
// was empty — Vercel wasn't populating it), and the two-segment paths
// (.../register, .../participants) got a platform-level 404 (the function
// was never invoked at all for those). This was reproducible 3/3, not a
// fluke, and identical code had worked correctly on a different Vercel
// project earlier — so this reads as an inconsistency in how Vercel's
// non-Next.js catch-all routing resolves in some deployments, not a bug in
// our code. `[id].ts` (a single dynamic segment) is Vercel's most basic,
// most heavily-used routing primitive; "sub-actions" that used to be extra
// path segments are now a `?action=` query param instead, which is always
// reliably delivered on req.query regardless of catch-all quirks.
function getId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

function getAction(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.action) ? req.query.action[0] : req.query.action
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = getId(req)
  if (!id) {
    sendError(res, 'Missing event id', 400)
    return
  }
  if (!isValidUuid(id)) {
    sendError(res, 'Event not found', 404)
    return
  }
  const action = getAction(req)

  if (!action) {
    if (req.method === 'GET') {
      // Public route (no withAuth to piggyback rate limiting on) —
      // IP-scoped limit applied directly here instead.
      if (!(await enforceIpRateLimit(req, res))) return
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

  if (action === 'register') {
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

  if (action === 'participants') {
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

// --- /api/events/:id?action=register ------------------------------------------

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
      // Postgres's default READ COMMITTED isolation lets two concurrent
      // transactions both read the same activeCount before either commits,
      // over-filling a nearly-full event — an advisory lock keyed on this
      // event's id serializes concurrent registration attempts for THE
      // SAME event (different events don't contend), and auto-releases at
      // commit/rollback since this is the _xact_ variant.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${eventId})::bigint)`

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

// --- /api/events/:id?action=participants ---------------------------------------

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
          memberProfile: {
            select: {
              firstNameFr: true,
              lastNameFr: true,
              firstNameAr: true,
              lastNameAr: true,
              phoneMobile: true,
            },
          },
        },
      },
    },
  })

  sendSuccess(res, registrations)
}

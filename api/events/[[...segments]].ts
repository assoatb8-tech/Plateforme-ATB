import { Prisma } from '@prisma/client'
import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withRole } from '../_lib/middlewares/rbac.js'
import { withAuth, getOptionalUser, type AuthedUser } from '../_lib/middlewares/auth.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'
import { eventCreateSchema, eventUpdateSchema } from '../_lib/validators/event.js'
import { serializeEvent } from '../_lib/utils/eventSerializer.js'
import { logAdminAction } from '../_lib/utils/auditLog.js'

const PAGE_SIZE = 9

// Vercel's Hobby plan caps a deployment at 12 Serverless Functions, and
// events/events-by-id/register/participants used to be 4 separate files —
// combined with the equally-sized users/payments groups, the project
// exceeded that limit on deploy (invisible locally: nothing about the
// function count shows up in tsc/eslint/build). Consolidated into one
// optional catch-all route (`[[...segments]]`) dispatching on path shape
// instead. Every handler body below is unchanged from its original file —
// only the routing shell is new.
function getSegments(req: VercelRequest): string[] {
  const raw = req.query.segments
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const segments = getSegments(req)

  if (segments.length === 0) {
    if (req.method === 'GET') {
      await handleList(req, res)
      return
    }
    if (req.method === 'POST') {
      await withRole(['ADMIN'], handleCreate)(req, res)
      return
    }
    sendError(res, 'Method not allowed', 405)
    return
  }

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

// --- /api/events -----------------------------------------------------------

async function handleList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page
  const searchParam = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search
  const allParam = Array.isArray(req.query.all) ? req.query.all[0] : req.query.all

  const page = Math.max(1, Number(pageParam) || 1)
  const search = searchParam?.trim() ?? ''

  const user = await getOptionalUser(req)

  // `all=true` drops the ACTIVE-only filter so the admin events page (which
  // must manage cancelled events too, per FEATURES.md "Gestion des
  // événements") can see everything. Not in API.md's literal query list —
  // gated server-side on the caller's actual role (never trusting the
  // query string itself) rather than adding a whole parallel admin-only
  // listing endpoint that would duplicate this pagination/search logic.
  let includeAll = false
  if (allParam === 'true' && user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    includeAll = dbUser?.role === 'ADMIN'
  }

  const where = {
    ...(includeAll ? {} : { status: 'ACTIVE' as const }),
    ...(search
      ? {
          OR: [
            { titleFr: { contains: search, mode: 'insensitive' as const } },
            { titleAr: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.event.count({ where }),
  ])

  const eventIds = events.map((event) => event.id)

  const [registeredCounts, myRegistrations] = await Promise.all([
    prisma.eventRegistration.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds }, status: 'REGISTERED' },
      _count: { _all: true },
    }),
    (async () => {
      if (!user || eventIds.length === 0) return []
      return prisma.eventRegistration.findMany({
        where: { eventId: { in: eventIds }, userId: user.id },
      })
    })(),
  ])

  const countByEventId = new Map(registeredCounts.map((row) => [row.eventId, row._count._all]))
  const myRegistrationByEventId = new Map(
    myRegistrations.map((registration) => [registration.eventId, registration.status]),
  )

  sendSuccess(res, {
    events: events.map((event) =>
      serializeEvent(
        { ...event, registeredCount: countByEventId.get(event.id) ?? 0 },
        myRegistrationByEventId.get(event.id) ?? null,
      ),
    ),
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

async function handleCreate(req: VercelRequest, res: VercelResponse, user: { id: string }) {
  const parsed = eventCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const event = await prisma.event.create({
    data: {
      titleFr: parsed.data.titleFr,
      titleAr: parsed.data.titleAr,
      descriptionFr: parsed.data.descriptionFr,
      descriptionAr: parsed.data.descriptionAr,
      location: parsed.data.location,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      maxParticipants: parsed.data.maxParticipants,
      createdBy: user.id,
    },
  })

  await logAdminAction(user.id, 'EVENT_CREATED', event.id)

  sendSuccess(res, serializeEvent({ ...event, registeredCount: 0 }, null), 201)
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

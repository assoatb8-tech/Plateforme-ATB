import { Prisma } from '@prisma/client'
import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withRole } from '../_lib/middlewares/rbac.js'
import { withAuth, getOptionalUser, type AuthedUser } from '../_lib/middlewares/auth.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'
import {
  eventUpdateSchema,
  eventLeaderSchema,
  eventAttendanceSchema,
  eventRegisterSchema,
  eventDaySelectionSchema,
  type EventDayInput,
} from '../_lib/validators/event.js'
import { serializeEvent } from '../_lib/utils/eventSerializer.js'
import { computeEventDateRange, parseTunisDateTime } from '../_lib/utils/eventSchedule.js'
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
        await handleRegister(id, authReq, user, authRes)
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

  if (action === 'days') {
    if (req.method !== 'PATCH') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await withAuth((authReq, authRes, user) => handleUpdateMyDays(id, authReq, authRes, user))(
      req,
      res,
    )
    return
  }

  if (action === 'participants') {
    if (req.method !== 'GET') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await withAuth((_authReq, authRes, user) => handleParticipants(id, authRes, user.id))(req, res)
    return
  }

  if (action === 'attendance') {
    if (req.method !== 'PATCH') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await withAuth((authReq, authRes, user) => handleSetAttendance(id, authReq, authRes, user.id))(
      req,
      res,
    )
    return
  }

  if (action === 'leader') {
    if (req.method !== 'PATCH') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await withRole(['ADMIN'], (roleReq, roleRes, user) =>
      handleAssignLeader(id, roleReq, roleRes, user.id),
    )(req, res)
    return
  }

  sendError(res, 'Not found', 404)
}

// --- /api/events/:id ---------------------------------------------------------

async function handleGet(id: string, req: VercelRequest, res: VercelResponse): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { days: { select: { id: true, startAt: true, endAt: true } } },
  })
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
        include: { daySelections: { select: { eventDayId: true } } },
      })
    : null
  const myRegistrationDayIds = myRegistration?.daySelections.map((s) => s.eventDayId) ?? []

  sendSuccess(
    res,
    serializeEvent(
      { ...event, registeredCount },
      myRegistration?.status ?? null,
      myRegistrationDayIds,
    ),
  )
}

// Thrown inside handleUpdate's transaction when the submitted (or existing,
// for a mode switch with no days supplied) schedule can't produce a valid
// startDate/endDate — caught outside and turned into a clean 400.
class ScheduleError extends Error {}

// Reconciles an event's EventDay rows against a submitted list by identity
// (`id` present = update that row, absent = create a new one; any existing
// row not mentioned is deleted) rather than delete-everything-and-recreate
// — the latter would cascade-delete every member's day selections on every
// unrelated edit (e.g. fixing a typo in one day's end time).
async function syncEventDays(
  tx: Prisma.TransactionClient,
  eventId: string,
  incomingDays: { id?: string; startAt: Date; endAt: Date }[],
) {
  const existing = await tx.eventDay.findMany({ where: { eventId }, select: { id: true } })
  const existingIds = new Set(existing.map((day) => day.id))
  const incomingIds = new Set(
    incomingDays
      .filter((day): day is typeof day & { id: string } => Boolean(day.id))
      .map((d) => d.id),
  )

  const idsToDelete = [...existingIds].filter((existingId) => !incomingIds.has(existingId))
  if (idsToDelete.length > 0) {
    await tx.eventDay.deleteMany({ where: { id: { in: idsToDelete } } })
  }

  for (const day of incomingDays) {
    if (day.id && existingIds.has(day.id)) {
      await tx.eventDay.update({
        where: { id: day.id },
        data: { startAt: day.startAt, endAt: day.endAt },
      })
    } else {
      await tx.eventDay.create({ data: { eventId, startAt: day.startAt, endAt: day.endAt } })
    }
  }

  return tx.eventDay.findMany({ where: { eventId }, orderBy: { startAt: 'asc' } })
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

  const { startDate, endDate, isMultiDay, days, ...rest } = parsed.data
  const nextIsMultiDay = isMultiDay ?? existing.isMultiDay

  try {
    const event = await prisma.$transaction(async (tx) => {
      let nextStartDate = existing.startDate
      let nextEndDate = existing.endDate

      if (nextIsMultiDay) {
        if (days) {
          const finalDays = await syncEventDays(
            tx,
            id,
            days.map((day: EventDayInput) => ({
              id: day.id,
              startAt: parseTunisDateTime(day.startAt),
              endAt: parseTunisDateTime(day.endAt),
            })),
          )
          if (finalDays.length === 0) {
            throw new ScheduleError('A multi-day event needs at least one day')
          }
          const range = computeEventDateRange(finalDays)
          nextStartDate = range.startDate
          nextEndDate = range.endDate
        } else if (!existing.isMultiDay) {
          // Switching to multi-day with no days submitted — nothing to
          // derive a schedule from.
          throw new ScheduleError('At least one day is required to switch to a multi-day event')
        }
        // else: staying multi-day with no day changes in this request —
        // keep the event's already-computed startDate/endDate as-is.
      } else {
        if (existing.isMultiDay) {
          // Downgrading to single-day — the days no longer mean anything;
          // cascades their members' day selections too.
          await tx.eventDay.deleteMany({ where: { eventId: id } })
        }
        if (startDate) nextStartDate = parseTunisDateTime(startDate)
        if (endDate) nextEndDate = parseTunisDateTime(endDate)
      }

      return tx.event.update({
        where: { id },
        data: {
          ...rest,
          isMultiDay: nextIsMultiDay,
          startDate: nextStartDate,
          endDate: nextEndDate,
        },
        include: { days: { select: { id: true, startAt: true, endAt: true } } },
      })
    })

    await logAdminAction(adminId, 'EVENT_UPDATED', id)

    const registeredCount = await prisma.eventRegistration.count({
      where: { eventId: id, status: 'REGISTERED' },
    })

    sendSuccess(res, serializeEvent({ ...event, registeredCount }, null))
  } catch (error) {
    if (error instanceof ScheduleError) {
      sendError(res, error.message, 400)
      return
    }
    throw error
  }
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
  req: VercelRequest,
  user: AuthedUser,
  res: VercelResponse,
): Promise<void> {
  const parsed = eventRegisterSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { days: { select: { id: true } } },
  })
  if (!event) {
    sendError(res, 'Event not found', 404)
    return
  }
  if (event.status !== 'ACTIVE') {
    sendError(res, 'This event is not open for registration', 400)
    return
  }

  // A multi-day event requires picking at least one real day up front —
  // enforced here rather than in the zod schema since "required" depends
  // on which event this is, not on the shape of the body alone.
  let dayIds: string[] = []
  if (event.isMultiDay) {
    const validDayIds = new Set(event.days.map((day) => day.id))
    dayIds = parsed.data.dayIds ?? []
    if (dayIds.length === 0 || dayIds.some((dayId) => !validDayIds.has(dayId))) {
      sendError(res, 'At least one valid day must be selected for a multi-day event', 400)
      return
    }
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

      const reg = existing
        ? await tx.eventRegistration.update({
            where: { id: existing.id },
            data: { status, registeredAt: new Date() },
          })
        : await tx.eventRegistration.create({ data: { eventId, userId: user.id, status } })

      if (event.isMultiDay) {
        // Replace wholesale — covers both a fresh registration and a
        // cancelled-then-rejoined one picking different days this time.
        await tx.eventDaySelection.deleteMany({ where: { registrationId: reg.id } })
        await tx.eventDaySelection.createMany({
          data: dayIds.map((dayId) => ({ registrationId: reg.id, eventDayId: dayId })),
        })
      }

      return reg
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

// --- /api/events/:id?action=days --------------------------------------------

// PATCH — the caller's own REGISTERED registration only. Lets a member
// change which day(s) of a multi-day event they intend to attend without
// going through cancel+re-register (which would also risk losing their
// REGISTERED spot to the waitlist if the event had since filled up).
async function handleUpdateMyDays(
  eventId: string,
  req: VercelRequest,
  res: VercelResponse,
  user: AuthedUser,
): Promise<void> {
  const parsed = eventDaySelectionSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { days: { select: { id: true } } },
  })
  if (!event || !event.isMultiDay) {
    sendError(res, 'Event not found', 404)
    return
  }

  const validDayIds = new Set(event.days.map((day) => day.id))
  if (parsed.data.dayIds.some((dayId) => !validDayIds.has(dayId))) {
    sendError(res, 'Invalid day selection', 400)
    return
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  })
  if (!registration || registration.status === 'CANCELLED') {
    sendError(res, 'You are not registered for this event', 404)
    return
  }

  await prisma.$transaction([
    prisma.eventDaySelection.deleteMany({ where: { registrationId: registration.id } }),
    prisma.eventDaySelection.createMany({
      data: parsed.data.dayIds.map((dayId) => ({
        registrationId: registration.id,
        eventDayId: dayId,
      })),
    }),
  ])

  sendSuccess(res, { dayIds: parsed.data.dayIds })
}

// --- /api/events/:id?action=participants ---------------------------------------

// Shared by the participants list and attendance-marking action: both are
// available to an ADMIN or to the event's own leader ("chef de groupe"),
// never to any other member — checked here against the DB role/leaderId,
// never trusted from the client.
async function canManageEvent(
  event: { leaderId: string | null },
  userId: string,
): Promise<boolean> {
  if (event.leaderId === userId) return true
  const requester = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return requester?.role === 'ADMIN'
}

async function handleParticipants(
  eventId: string,
  res: VercelResponse,
  userId: string,
): Promise<void> {
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) {
    sendError(res, 'Event not found', 404)
    return
  }

  if (!(await canManageEvent(event, userId))) {
    sendError(res, 'Forbidden', 403)
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
              photoUrl: true,
            },
          },
        },
      },
      daySelections: {
        select: { eventDay: { select: { id: true, startAt: true, endAt: true } } },
      },
    },
  })

  sendSuccess(res, registrations)
}

// --- /api/events/:id?action=attendance --------------------------------------

// PATCH — ADMIN or the event's leader. Only meaningful once the event has
// ended (can't confirm attendance for something that hasn't happened yet),
// and only for a REGISTERED row — a waiting-list or cancelled entry was
// never actually expected to show up.
async function handleSetAttendance(
  eventId: string,
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
): Promise<void> {
  const parsed = eventAttendanceSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) {
    sendError(res, 'Event not found', 404)
    return
  }

  if (!(await canManageEvent(event, userId))) {
    sendError(res, 'Forbidden', 403)
    return
  }

  if (new Date(event.endDate) > new Date()) {
    sendError(res, 'Cannot record attendance before the event has ended', 400)
    return
  }

  const { registrationId, status } = parsed.data
  const registration = await prisma.eventRegistration.findUnique({ where: { id: registrationId } })
  if (!registration || registration.eventId !== eventId || registration.status !== 'REGISTERED') {
    sendError(res, 'Registration not found', 404)
    return
  }

  const updated = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { attendanceStatus: status },
  })

  sendSuccess(res, updated)
}

// --- /api/events/:id?action=leader ----------------------------------------

// PATCH — ADMIN. userId: null unassigns; otherwise the given user must
// have a REGISTERED (not waiting-list/cancelled) registration for this
// event — a leader has to actually be a confirmed participant.
async function handleAssignLeader(
  eventId: string,
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
): Promise<void> {
  const parsed = eventLeaderSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) {
    sendError(res, 'Event not found', 404)
    return
  }

  const { userId } = parsed.data
  if (userId) {
    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    })
    if (!registration || registration.status !== 'REGISTERED') {
      sendError(res, 'This user is not a confirmed participant of this event', 400)
      return
    }
  }

  await prisma.event.update({ where: { id: eventId }, data: { leaderId: userId } })
  await logAdminAction(adminId, userId ? 'EVENT_LEADER_ASSIGNED' : 'EVENT_LEADER_REMOVED', eventId)

  sendSuccess(res, { leaderId: userId })
}

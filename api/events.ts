import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withRole } from './_lib/middlewares/rbac.js'
import { getOptionalUser } from './_lib/middlewares/auth.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'
import { eventCreateSchema } from './_lib/validators/event.js'
import { serializeEvent } from './_lib/utils/eventSerializer.js'
import { logAdminAction } from './_lib/utils/auditLog.js'
import { enforceIpRateLimit } from './_lib/utils/rateLimit.js'

const PAGE_SIZE = 9

// This file owns exactly '/api/events'; api/events/[id].ts owns
// '/api/events/:id' and its ?action= sub-routes (see that file for why
// it's a single dynamic segment rather than a catch-all).
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    // Public route (no withAuth to piggyback rate limiting on) — IP-scoped
    // limit applied directly here instead.
    if (!(await enforceIpRateLimit(req, res))) return
    await handleList(req, res)
    return
  }

  if (req.method === 'POST') {
    await withRole(['ADMIN'], handleCreate)(req, res)
    return
  }

  sendError(res, 'Method not allowed', 405)
}

async function handleList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page
  const searchParam = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search
  const allParam = Array.isArray(req.query.all) ? req.query.all[0] : req.query.all
  const whenParam = Array.isArray(req.query.when) ? req.query.when[0] : req.query.when

  const page = Math.max(1, Number(pageParam) || 1)
  const search = searchParam?.trim() ?? ''

  // Only filters by time when the caller explicitly asks — the admin
  // events list intentionally never sends `when` (it manages every event
  // regardless of date), so leaving it unset preserves that unfiltered
  // view exactly. The public events page always sends one or the other.
  const now = new Date()
  const timeWhere =
    whenParam === 'past'
      ? { endDate: { lt: now } }
      : whenParam === 'upcoming'
        ? { endDate: { gte: now } }
        : {}

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
    ...timeWhere,
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

  // Soonest-first for upcoming (and the unfiltered admin view); most-recent-
  // first for past, since that's what's actually useful when browsing an
  // archive.
  const orderBy = { startDate: whenParam === 'past' ? ('desc' as const) : ('asc' as const) }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
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
      facebookPostUrl: parsed.data.facebookPostUrl,
      bannerUrl: parsed.data.bannerUrl,
      createdBy: user.id,
    },
  })

  await logAdminAction(user.id, 'EVENT_CREATED', event.id)

  sendSuccess(res, serializeEvent({ ...event, registeredCount: 0 }, null), 201)
}

import type { VercelRequest, VercelResponse } from './types'
import { prisma } from './utils/prisma'
import { withRole } from './middlewares/rbac'
import { getOptionalUser } from './middlewares/auth'
import { sendError, sendSuccess } from './utils/response'
import { eventCreateSchema } from './validators/event'
import { serializeEvent } from './utils/eventSerializer'

const PAGE_SIZE = 9

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
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

  const page = Math.max(1, Number(pageParam) || 1)
  const search = searchParam?.trim() ?? ''

  const where = {
    status: 'ACTIVE' as const,
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
      const user = await getOptionalUser(req)
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

  sendSuccess(res, serializeEvent({ ...event, registeredCount: 0 }, null), 201)
}

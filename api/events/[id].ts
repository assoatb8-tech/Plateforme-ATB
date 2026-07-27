import type { VercelRequest, VercelResponse } from '../types'
import { prisma } from '../utils/prisma'
import { withRole } from '../middlewares/rbac'
import { getOptionalUser } from '../middlewares/auth'
import { sendError, sendSuccess } from '../utils/response'
import { eventUpdateSchema } from '../validators/event'
import { serializeEvent } from '../utils/eventSerializer'

function getEventId(req: VercelRequest): string | undefined {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = getEventId(req)
  if (!id) {
    sendError(res, 'Missing event id', 400)
    return
  }

  if (req.method === 'GET') {
    await handleGet(id, req, res)
    return
  }

  if (req.method === 'PATCH') {
    await withRole(['ADMIN'], (roleReq, roleRes) => handleUpdate(id, roleReq, roleRes))(req, res)
    return
  }

  if (req.method === 'DELETE') {
    await withRole(['ADMIN'], (_roleReq, roleRes) => handleDelete(id, roleRes))(req, res)
    return
  }

  sendError(res, 'Method not allowed', 405)
}

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

async function handleUpdate(id: string, req: VercelRequest, res: VercelResponse): Promise<void> {
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

  const registeredCount = await prisma.eventRegistration.count({
    where: { eventId: id, status: 'REGISTERED' },
  })

  sendSuccess(res, serializeEvent({ ...event, registeredCount }, null))
}

async function handleDelete(id: string, res: VercelResponse): Promise<void> {
  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'Event not found', 404)
    return
  }

  await prisma.event.delete({ where: { id } })
  sendSuccess(res, { id })
}

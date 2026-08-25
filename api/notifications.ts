import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withAuth, type AuthedUser } from './_lib/middlewares/auth.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'
import { tunisDayBounds } from './_lib/utils/eventSchedule.js'

const LIST_LIMIT = 50

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const value = req.query[key]
  return Array.isArray(value) ? value[0] : value
}

// GET  -> { notifications, unreadCount } for the caller, newest first.
// PATCH ?id=<notificationId> -> marks that one read (ownership-checked).
// PATCH ?action=read-all     -> marks every unread notification of the
// caller's as read.
// GET  ?action=send-reminders -> fans out EVENT_REMINDER notifications for
// tomorrow's events; called by Vercel Cron (see vercel.json), never by a
// signed-in user, so it's checked against CRON_SECRET *before* withAuth
// rather than folded into the authenticated handler below.
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET' && getQueryParam(req, 'action') === 'send-reminders') {
    await handleSendReminders(req, res)
    return
  }

  await withAuth(async (authReq, authRes, user: AuthedUser) => {
    if (authReq.method === 'GET') {
      await handleList(user, authRes)
      return
    }
    if (authReq.method === 'PATCH') {
      await handlePatch(user, authReq, authRes)
      return
    }
    sendError(authRes, 'Method not allowed', 405)
  })(req, res)
}

// Vercel automatically attaches `Authorization: Bearer $CRON_SECRET` to
// requests it makes to a scheduled cron path, as long as a CRON_SECRET
// environment variable is set on the project — see MANUAL_TESTING_GUIDE.md
// for the one-time setup step. Never trust this endpoint without it: it's
// otherwise a public URL that fans out DB writes to every member.
async function handleSendReminders(req: VercelRequest, res: VercelResponse): Promise<void> {
  const expected = process.env.CRON_SECRET
  const authHeader = req.headers.authorization
  if (!expected || authHeader !== `Bearer ${expected}`) {
    sendError(res, 'Unauthorized', 401)
    return
  }

  const { start, end } = tunisDayBounds(1)

  const [singleDayEvents, multiDayDays] = await Promise.all([
    prisma.event.findMany({
      where: { isMultiDay: false, status: 'ACTIVE', startDate: { gte: start, lt: end } },
      select: {
        id: true,
        registrations: { where: { status: 'REGISTERED' }, select: { userId: true } },
      },
    }),
    prisma.eventDay.findMany({
      where: { startAt: { gte: start, lt: end }, event: { status: 'ACTIVE', isMultiDay: true } },
      select: {
        eventId: true,
        selections: {
          where: { registration: { status: 'REGISTERED' } },
          select: { registration: { select: { userId: true } } },
        },
      },
    }),
  ])

  // One reminder per (event, member) even if a multi-day event has more
  // than one of its days falling "tomorrow" relative to different cron
  // runs — collapsed here per run; the createdAt-scoped check below still
  // guards against a member getting reminded twice for the same event on
  // the same calendar day if this endpoint is ever invoked more than once.
  const targets = new Map<string, Set<string>>()
  for (const event of singleDayEvents) {
    const recipients = targets.get(event.id) ?? new Set<string>()
    for (const registration of event.registrations) recipients.add(registration.userId)
    targets.set(event.id, recipients)
  }
  for (const day of multiDayDays) {
    const recipients = targets.get(day.eventId) ?? new Set<string>()
    for (const selection of day.selections) recipients.add(selection.registration.userId)
    targets.set(day.eventId, recipients)
  }

  const sinceMidnightUtc = new Date()
  sinceMidnightUtc.setUTCHours(0, 0, 0, 0)

  let created = 0
  for (const [eventId, userIds] of targets) {
    for (const userId of userIds) {
      const alreadySent = await prisma.notification.findFirst({
        where: { userId, eventId, type: 'EVENT_REMINDER', createdAt: { gte: sinceMidnightUtc } },
        select: { id: true },
      })
      if (alreadySent) continue
      await prisma.notification.create({ data: { userId, eventId, type: 'EVENT_REMINDER' } })
      created++
    }
  }

  sendSuccess(res, { created })
}

async function handleList(user: AuthedUser, res: VercelResponse): Promise<void> {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
      include: {
        event: { select: { id: true, titleFr: true, titleAr: true } },
        relatedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberProfile: {
              select: { firstNameFr: true, lastNameFr: true, firstNameAr: true, lastNameAr: true },
            },
          },
        },
      },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ])

  sendSuccess(res, {
    // Same "prefer the completed membership-form name, fall back to the
    // bare registration name" merge as GET /api/users, so a NEW_MEMBER
    // notification can show a name even before that member has finished
    // their profile.
    notifications: notifications.map((notification) => ({
      ...notification,
      relatedUser: notification.relatedUser
        ? {
            id: notification.relatedUser.id,
            firstNameFr:
              notification.relatedUser.memberProfile?.firstNameFr ||
              notification.relatedUser.firstName ||
              null,
            lastNameFr:
              notification.relatedUser.memberProfile?.lastNameFr ||
              notification.relatedUser.lastName ||
              null,
            firstNameAr:
              notification.relatedUser.memberProfile?.firstNameAr ||
              notification.relatedUser.firstName ||
              null,
            lastNameAr:
              notification.relatedUser.memberProfile?.lastNameAr ||
              notification.relatedUser.lastName ||
              null,
          }
        : null,
    })),
    unreadCount,
  })
}

async function handlePatch(
  user: AuthedUser,
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const action = getQueryParam(req, 'action')

  if (action === 'read-all') {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    sendSuccess(res, { updated: true })
    return
  }

  const id = getQueryParam(req, 'id')
  if (!id) {
    sendError(res, 'Missing notification id', 400)
    return
  }

  const existing = await prisma.notification.findUnique({ where: { id } })
  if (!existing || existing.userId !== user.id) {
    sendError(res, 'Notification not found', 404)
    return
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  })

  sendSuccess(res, notification)
}

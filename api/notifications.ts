import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withAuth, type AuthedUser } from './_lib/middlewares/auth.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'

const LIST_LIMIT = 50

// GET  -> { notifications, unreadCount } for the caller, newest first.
// PATCH ?id=<notificationId> -> marks that one read (ownership-checked).
// PATCH ?action=read-all     -> marks every unread notification of the
// caller's as read.
export default withAuth(async (req: VercelRequest, res: VercelResponse, user: AuthedUser) => {
  if (req.method === 'GET') {
    await handleList(user, res)
    return
  }
  if (req.method === 'PATCH') {
    await handlePatch(user, req, res)
    return
  }
  sendError(res, 'Method not allowed', 405)
})

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

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const value = req.query[key]
  return Array.isArray(value) ? value[0] : value
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

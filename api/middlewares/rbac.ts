import type { VercelRequest, VercelResponse } from '../types'
import type { Role } from '@prisma/client'
import { prisma } from '../utils/prisma'
import { sendError } from '../utils/response'
import { withAuth, type AuthedUser } from './auth'

export type RoleHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user: AuthedUser & { role: Role },
) => Promise<void> | void

export function withRole(allowedRoles: Role[], handler: RoleHandler) {
  return withAuth(async (req, res, user) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!dbUser || !allowedRoles.includes(dbUser.role)) {
      sendError(res, 'Forbidden', 403)
      return
    }

    await handler(req, res, { ...user, role: dbUser.role })
  })
}

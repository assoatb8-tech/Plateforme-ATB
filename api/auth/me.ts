import type { VercelRequest, VercelResponse } from '../_lib/types.js'
import { prisma } from '../_lib/utils/prisma.js'
import { withAuth } from '../_lib/middlewares/auth.js'
import { sendError, sendSuccess } from '../_lib/utils/response.js'

export default withAuth(async (req: VercelRequest, res: VercelResponse, user) => {
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { memberProfile: { select: { id: true } } },
  })

  if (!dbUser) {
    sendError(res, 'User not found', 404)
    return
  }

  sendSuccess(res, {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status,
    hasProfile: Boolean(dbUser.memberProfile),
  })
})

import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withRole } from './_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'
import { enforceIpRateLimit } from './_lib/utils/rateLimit.js'
import { bureauMemberCreateSchema } from './_lib/validators/bureau.js'
import { logAdminAction } from './_lib/utils/auditLog.js'
import { isValidUuid } from './_lib/utils/validateId.js'

// Same create/delete-only, single-file shape as api/sponsors.ts — admin
// picks exactly who appears on the public /bureau page by adding/removing
// rows, no edit or reorder. One file (not the x.ts + x/[id].ts pair) keeps
// this to a single Vercel function.
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    if (!(await enforceIpRateLimit(req, res))) return
    await handleList(req, res)
    return
  }
  if (req.method === 'POST') {
    await withRole(['ADMIN'], handleCreate)(req, res)
    return
  }
  if (req.method === 'DELETE') {
    await withRole(['ADMIN'], handleDelete)(req, res)
    return
  }
  sendError(res, 'Method not allowed', 405)
}

// GET /api/bureau — public, the Bureau page. Insertion order (no manual
// reordering), oldest first so newly-added members append at the end.
async function handleList(_req: VercelRequest, res: VercelResponse): Promise<void> {
  const members = await prisma.bureauMember.findMany({ orderBy: { createdAt: 'asc' } })
  sendSuccess(res, members)
}

// POST /api/bureau — ADMIN.
async function handleCreate(
  req: VercelRequest,
  res: VercelResponse,
  user: { id: string },
): Promise<void> {
  const parsed = bureauMemberCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const member = await prisma.bureauMember.create({ data: parsed.data })
  await logAdminAction(user.id, 'BUREAU_MEMBER_CREATED', member.id)

  sendSuccess(res, member, 201)
}

// DELETE /api/bureau?id=... — ADMIN.
async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  user: { id: string },
): Promise<void> {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!id || !isValidUuid(id)) {
    sendError(res, 'Bureau member not found', 404)
    return
  }

  const existing = await prisma.bureauMember.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'Bureau member not found', 404)
    return
  }

  await prisma.bureauMember.delete({ where: { id } })
  await logAdminAction(user.id, 'BUREAU_MEMBER_DELETED', id)

  sendSuccess(res, { id })
}

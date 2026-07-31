import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withRole } from './_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'
import { enforceIpRateLimit } from './_lib/utils/rateLimit.js'
import { sponsorCreateSchema } from './_lib/validators/sponsor.js'
import { logAdminAction } from './_lib/utils/auditLog.js'
import { supabaseAdmin } from './_lib/utils/supabaseAdmin.js'
import { isValidUuid } from './_lib/utils/validateId.js'

// No edit, no reorder (product decision) — just create and delete, so this
// stays a single file rather than the x.ts + x/[id].ts pair used by
// events/users/payments. Deleting by id via a ?id= query param instead of
// a path segment keeps the whole feature to one Vercel function (the Hobby
// plan's 12-function cap had no headroom left for a second file).
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

// GET /api/sponsors — public, homepage marquee. Insertion order (no manual
// reordering exists), oldest first so newly-added sponsors append at the end.
async function handleList(_req: VercelRequest, res: VercelResponse): Promise<void> {
  const sponsors = await prisma.sponsor.findMany({ orderBy: { createdAt: 'asc' } })
  sendSuccess(res, sponsors)
}

// POST /api/sponsors — ADMIN. logoUrl is the public Storage URL the
// browser gets back after uploading directly to the sponsor-logos bucket
// (src/features/admin/sponsors) — this endpoint never handles the file itself.
async function handleCreate(
  req: VercelRequest,
  res: VercelResponse,
  user: { id: string },
): Promise<void> {
  const parsed = sponsorCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const sponsor = await prisma.sponsor.create({ data: parsed.data })
  await logAdminAction(user.id, 'SPONSOR_CREATED', sponsor.id)

  sendSuccess(res, sponsor, 201)
}

// DELETE /api/sponsors?id=... — ADMIN.
async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  user: { id: string },
): Promise<void> {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  if (!id || !isValidUuid(id)) {
    sendError(res, 'Sponsor not found', 404)
    return
  }

  const existing = await prisma.sponsor.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'Sponsor not found', 404)
    return
  }

  await prisma.sponsor.delete({ where: { id } })
  await logAdminAction(user.id, 'SPONSOR_DELETED', id)

  // Best-effort: reclaim the storage object too, but a failure here
  // shouldn't fail the delete itself (the DB row is already gone, which is
  // what actually matters — an orphaned file is just wasted quota, not a
  // correctness or security issue).
  const marker = '/object/public/sponsor-logos/'
  const markerIndex = existing.logoUrl.indexOf(marker)
  if (markerIndex !== -1) {
    const path = existing.logoUrl.slice(markerIndex + marker.length)
    const { error } = await supabaseAdmin.storage.from('sponsor-logos').remove([path])
    if (error) {
      console.error(`Failed to remove sponsor logo from storage (${path}):`, error.message)
    }
  }

  sendSuccess(res, { id })
}

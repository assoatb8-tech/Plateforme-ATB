import { Prisma } from '@prisma/client'
import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withRole } from './_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'
import { enforceIpRateLimit } from './_lib/utils/rateLimit.js'
import { bureauMemberCreateSchema } from './_lib/validators/bureau.js'
import { logAdminAction } from './_lib/utils/auditLog.js'
import { isValidUuid } from './_lib/utils/validateId.js'
import { supabaseAdmin } from './_lib/utils/supabaseAdmin.js'

const MEMBERS_BUCKET = 'members'

// Same create/delete-only, single-file shape as api/sponsors.ts. Admin picks
// an existing member (not freeform text) to appear on the public /bureau
// page — see 012_bureau_link_members.sql for why. One file (not the x.ts +
// x/[id].ts pair) keeps this to a single Vercel function.
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
//
// The member's photo lives in the private "members" bucket (only the owner
// or an admin can normally read it — see 003_storage.sql), so a public,
// unauthenticated caller can't sign its own URL for it. This is the one
// deliberate exception in the app to "never expose member data publicly"
// (MEMBER_FORM.md's confidentiality section): a member appears here only
// because an admin explicitly chose to publish them as a Bureau member,
// same as any association would publish its leadership's photos. The
// service-role client bypasses RLS to generate a short-lived signed URL
// for exactly the photos of members an admin has opted in this way —
// nothing else is reachable through this endpoint.
async function handleList(_req: VercelRequest, res: VercelResponse): Promise<void> {
  const members = await prisma.bureauMember.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          email: true,
          memberProfile: {
            select: {
              firstNameFr: true,
              lastNameFr: true,
              firstNameAr: true,
              lastNameAr: true,
              phoneMobile: true,
              contactEmail: true,
              photoUrl: true,
            },
          },
        },
      },
    },
  })

  const dtos = await Promise.all(
    members.map(async (member) => {
      const profile = member.user.memberProfile
      let photoUrl: string | null = null
      if (profile?.photoUrl) {
        const { data } = await supabaseAdmin.storage
          .from(MEMBERS_BUCKET)
          .createSignedUrl(profile.photoUrl, 3600)
        photoUrl = data?.signedUrl ?? null
      }

      return {
        id: member.id,
        firstNameFr: profile?.firstNameFr ?? '',
        lastNameFr: profile?.lastNameFr ?? '',
        firstNameAr: profile?.firstNameAr ?? '',
        lastNameAr: profile?.lastNameAr ?? '',
        phone: profile?.phoneMobile ?? '',
        email: profile?.contactEmail ?? member.user.email,
        facebookUrl: member.facebookUrl,
        photoUrl,
        createdAt: member.createdAt,
      }
    }),
  )

  sendSuccess(res, dtos)
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

// POST /api/bureau — ADMIN. Links an existing member account instead of
// accepting freeform name/phone/email/photo — the member must already have
// a completed profile with a photo (every member is required to have one),
// which is what ends up shown on the public page.
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

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { memberProfile: { select: { photoUrl: true } } },
  })
  if (!targetUser) {
    sendError(res, 'Member not found', 404)
    return
  }
  if (!targetUser.memberProfile?.photoUrl) {
    sendError(res, 'This member does not have a profile photo yet', 400)
    return
  }

  try {
    const member = await prisma.bureauMember.create({ data: parsed.data })
    await logAdminAction(user.id, 'BUREAU_MEMBER_CREATED', member.id)
    sendSuccess(res, member, 201)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      sendError(res, 'This member is already part of the Bureau', 409)
      return
    }
    throw error
  }
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

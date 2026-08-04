import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withRole } from './_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'

const PAGE_SIZE = 20
const STATUS_VALUES = ['ACTIVE', 'PENDING', 'BANNED'] as const
type StatusFilter = (typeof STATUS_VALUES)[number]

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Split from a single api/users/[[...segments]].ts — see api/events.ts for
// why (Vercel's plain Functions don't match the zero-segment base path with
// an optional catch-all). This file owns exactly '/api/users';
// api/users/[...segments].ts owns everything under it.
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405)
    return
  }
  await withRole(['ADMIN'], handleList)(req, res)
}

// GET /api/users — ADMIN. Paginated list, searchable by email or member
// name (either language), filterable by status. Joins MemberProfile for
// display purposes only (name fields/phoneMobile) — full detail lives
// behind GET /api/users/:id.
async function handleList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const page = Math.max(1, Number(firstParam(req.query.page)) || 1)
  const search = firstParam(req.query.search)?.trim() ?? ''
  const statusParam = firstParam(req.query.status)
  const status: StatusFilter | undefined = STATUS_VALUES.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : undefined

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { memberProfile: { firstNameFr: { contains: search, mode: 'insensitive' as const } } },
            { memberProfile: { lastNameFr: { contains: search, mode: 'insensitive' as const } } },
            { memberProfile: { firstNameAr: { contains: search, mode: 'insensitive' as const } } },
            { memberProfile: { lastNameAr: { contains: search, mode: 'insensitive' as const } } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        memberProfile: {
          select: {
            firstNameFr: true,
            lastNameFr: true,
            firstNameAr: true,
            lastNameAr: true,
            phoneMobile: true,
            photoUrl: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  sendSuccess(res, {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      firstNameFr: u.memberProfile?.firstNameFr || u.firstName || null,
      lastNameFr: u.memberProfile?.lastNameFr || u.lastName || null,
      firstNameAr: u.memberProfile?.firstNameAr || u.firstName || null,
      lastNameAr: u.memberProfile?.lastNameAr || u.lastName || null,
      phoneMobile: u.memberProfile?.phoneMobile ?? null,
      photoUrl: u.memberProfile?.photoUrl ?? null,
    })),
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

import type { VercelRequest, VercelResponse } from './types'
import { prisma } from './utils/prisma'
import { withRole } from './middlewares/rbac'
import { sendError, sendSuccess } from './utils/response'

const PAGE_SIZE = 20
const STATUS_VALUES = ['ACTIVE', 'PENDING', 'BANNED'] as const
type StatusFilter = (typeof STATUS_VALUES)[number]

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendError(res, 'Method not allowed', 405)
    return
  }

  await withRole(['ADMIN'], handleList)(req, res)
}

// GET /api/users — ADMIN. Paginated list, searchable by email or member
// full name, filterable by status. Joins MemberProfile for display purposes
// only (fullName/phoneMobile) — full detail lives behind GET /api/users/:id.
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
            { memberProfile: { fullName: { contains: search, mode: 'insensitive' as const } } },
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
        role: true,
        status: true,
        createdAt: true,
        memberProfile: { select: { fullName: true, phoneMobile: true } },
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
      fullName: u.memberProfile?.fullName ?? null,
      phoneMobile: u.memberProfile?.phoneMobile ?? null,
    })),
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

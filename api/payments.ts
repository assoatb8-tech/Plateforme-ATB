import type { VercelRequest, VercelResponse } from './_lib/types.js'
import { prisma } from './_lib/utils/prisma.js'
import { withRole } from './_lib/middlewares/rbac.js'
import { sendError, sendSuccess } from './_lib/utils/response.js'
import { paymentCreateSchema } from './_lib/validators/payment.js'
import { logAdminAction } from './_lib/utils/auditLog.js'

const PAGE_SIZE = 20
const STATUS_VALUES = ['PENDING', 'VALIDATED', 'REJECTED'] as const
const TYPE_VALUES = ['MEMBERSHIP', 'DONATION', 'OTHER'] as const
type StatusFilter = (typeof STATUS_VALUES)[number]
type TypeFilter = (typeof TYPE_VALUES)[number]

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Split from a single api/payments/[[...segments]].ts — see api/events.ts
// for why (Vercel's plain Functions don't match the zero-segment base path
// with an optional catch-all). This file owns exactly '/api/payments';
// api/payments/[...segments].ts owns everything under it.
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    await withRole(['ADMIN'], handleList)(req, res)
    return
  }
  if (req.method === 'POST') {
    await withRole(['ADMIN'], handleCreate)(req, res)
    return
  }
  sendError(res, 'Method not allowed', 405)
}

// GET /api/payments — ADMIN. List, filter by status/type/userId, paginated.
async function handleList(req: VercelRequest, res: VercelResponse): Promise<void> {
  const page = Math.max(1, Number(firstParam(req.query.page)) || 1)
  const statusParam = firstParam(req.query.status)
  const typeParam = firstParam(req.query.type)
  const userId = firstParam(req.query.userId)

  const status: StatusFilter | undefined = STATUS_VALUES.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : undefined
  const paymentType: TypeFilter | undefined = TYPE_VALUES.includes(typeParam as TypeFilter)
    ? (typeParam as TypeFilter)
    : undefined

  const where = {
    ...(status ? { status } : {}),
    ...(paymentType ? { paymentType } : {}),
    ...(userId ? { userId } : {}),
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, email: true, memberProfile: { select: { fullName: true } } } },
      },
    }),
    prisma.payment.count({ where }),
  ])

  sendSuccess(res, {
    payments,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  })
}

// POST /api/payments — ADMIN. Not listed in API.md's literal route list
// (which only documents GET /api/payments and PATCH /api/payments/:id) —
// added because there is no online payment gateway (see
// supabase/sql/002_rls_policies.sql: "cotisations recorded and validated by
// an administrator"), so this is the only way a Payment row is ever
// created. Same deviation pattern as api/registrations.ts in Phase 3.
async function handleCreate(
  req: VercelRequest,
  res: VercelResponse,
  user: { id: string },
): Promise<void> {
  const parsed = paymentCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const targetUser = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
  if (!targetUser) {
    sendError(res, 'User not found', 404)
    return
  }

  const payment = await prisma.payment.create({
    data: {
      userId: parsed.data.userId,
      amount: parsed.data.amount,
      paymentType: parsed.data.paymentType,
    },
  })

  await logAdminAction(user.id, 'PAYMENT_CREATED', payment.id)

  sendSuccess(res, payment, 201)
}

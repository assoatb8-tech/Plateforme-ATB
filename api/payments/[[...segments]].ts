import type { VercelRequest, VercelResponse } from '../types.js'
import { prisma } from '../utils/prisma.js'
import { withRole, type RoleHandler } from '../middlewares/rbac.js'
import { sendError, sendSuccess } from '../utils/response.js'
import { paymentCreateSchema, paymentStatusUpdateSchema } from '../validators/payment.js'
import { logAdminAction } from '../utils/auditLog.js'

const PAGE_SIZE = 20
const STATUS_VALUES = ['PENDING', 'VALIDATED', 'REJECTED'] as const
const TYPE_VALUES = ['MEMBERSHIP', 'DONATION', 'OTHER'] as const
type StatusFilter = (typeof STATUS_VALUES)[number]
type TypeFilter = (typeof TYPE_VALUES)[number]

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function getSegments(req: VercelRequest): string[] {
  const raw = req.query.segments
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

// See api/events/[[...segments]].ts for why this got consolidated — same
// Vercel Hobby-plan function-count limit. Both payments routes are
// ADMIN-only, so withRole wraps the whole dispatcher once.
const dispatch: RoleHandler = async (req, res, user) => {
  const segments = getSegments(req)

  if (segments.length === 0) {
    if (req.method === 'GET') {
      await handleList(req, res)
      return
    }
    if (req.method === 'POST') {
      await handleCreate(req, res, user)
      return
    }
    sendError(res, 'Method not allowed', 405)
    return
  }

  if (segments.length === 1) {
    if (req.method !== 'PATCH') {
      sendError(res, 'Method not allowed', 405)
      return
    }
    await handleUpdateStatus(segments[0], req, res, user.id)
    return
  }

  sendError(res, 'Not found', 404)
}

export default withRole(['ADMIN'], dispatch)

// --- /api/payments -------------------------------------------------------------

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

// --- /api/payments/:id ----------------------------------------------------------

// PATCH /api/payments/:id — ADMIN. Validates or rejects a cotisation.
async function handleUpdateStatus(
  id: string,
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
): Promise<void> {
  const parsed = paymentStatusUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues.map((issue) => issue.message).join(', '), 400)
    return
  }

  const existing = await prisma.payment.findUnique({ where: { id } })
  if (!existing) {
    sendError(res, 'Payment not found', 404)
    return
  }

  // Guard against double-validation races: two admins hitting PATCH on the
  // same PENDING payment at once, or a stale UI resubmitting after another
  // admin already acted. The conditional `status: 'PENDING'` filter makes
  // only one PATCH actually match a row — updateMany returns count 0 for
  // the loser instead of silently overwriting validatedBy/validatedAt with
  // whoever's request happened to run last.
  const { count } = await prisma.payment.updateMany({
    where: { id, status: 'PENDING' },
    data: {
      status: parsed.data.status,
      validatedBy: adminId,
      validatedAt: new Date(),
    },
  })

  if (count === 0) {
    sendError(res, 'Payment already processed', 409)
    return
  }

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id } })

  await logAdminAction(
    adminId,
    parsed.data.status === 'VALIDATED' ? 'PAYMENT_VALIDATED' : 'PAYMENT_REJECTED',
    id,
  )

  sendSuccess(res, payment)
}

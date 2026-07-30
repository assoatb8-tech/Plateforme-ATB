import { prisma } from './prisma.js'
import { sendError } from './response.js'
import type { VercelRequest, VercelResponse } from '../types.js'

const WINDOW_SECONDS = 60
const IP_LIMIT_PER_MINUTE = 100
const USER_LIMIT_PER_MINUTE = 60

// Fixed-window counter backed by Postgres — no new external service
// (Upstash/Vercel KV) needed, reuses the DB connection every request
// already pays for. The INSERT ... ON CONFLICT DO UPDATE is atomic, so
// concurrent requests from the same identifier can't under-count each
// other the way a read-then-write check would.
export async function checkRateLimit(identifier: string, limit: number): Promise<boolean> {
  const windowStart = new Date(
    Math.floor(Date.now() / (WINDOW_SECONDS * 1000)) * WINDOW_SECONDS * 1000,
  )

  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    INSERT INTO rate_limit_buckets (identifier, window_start, count)
    VALUES (${identifier}, ${windowStart}, 1)
    ON CONFLICT (identifier, window_start)
    DO UPDATE SET count = rate_limit_buckets.count + 1
    RETURNING count
  `

  // Opportunistic cleanup instead of a scheduled job (pg_cron isn't
  // enabled on this project) — cheap to let the table grow briefly,
  // pointless to keep rows past their window forever.
  if (Math.random() < 0.01) {
    await prisma.$executeRaw`DELETE FROM rate_limit_buckets WHERE window_start < now() - interval '1 hour'`
  }

  const count = result[0] ? Number(result[0].count) : 0
  return count <= limit
}

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return first?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
}

// Sends the 429 itself and returns false on rejection, so call sites read
// as a simple guard clause: `if (!(await enforceIpRateLimit(req, res))) return`.
export async function enforceIpRateLimit(
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  const ip = getClientIp(req)
  const ok = await checkRateLimit(`ip:${ip}`, IP_LIMIT_PER_MINUTE)
  if (!ok) {
    sendError(res, 'Too many requests, please slow down', 429)
    return false
  }
  return true
}

export async function enforceUserRateLimit(userId: string, res: VercelResponse): Promise<boolean> {
  const ok = await checkRateLimit(`user:${userId}`, USER_LIMIT_PER_MINUTE)
  if (!ok) {
    sendError(res, 'Too many requests, please slow down', 429)
    return false
  }
  return true
}

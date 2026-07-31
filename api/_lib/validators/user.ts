import { z } from 'zod'
import { stripHtmlTags } from '../utils/sanitize.js'

// UserStatus only has 3 values (see prisma/schema.prisma) — no "suspended"
// state exists, so admin actions can only move a user between these three.
export const userStatusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'BANNED']),
})

export const userRoleUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})

export const userBanSchema = z.object({
  reason: z.string().transform(stripHtmlTags).pipe(z.string().min(3)),
})

export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>
export type UserBanInput = z.infer<typeof userBanSchema>
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>

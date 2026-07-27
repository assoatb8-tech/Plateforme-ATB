// Hand-kept mirror of the Prisma enums that the frontend needs to know about.
// @prisma/client is server-only (Vercel Functions) and must never be bundled
// into the frontend, so these unions are duplicated here on purpose.

export type Role = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'PENDING' | 'BANNED'

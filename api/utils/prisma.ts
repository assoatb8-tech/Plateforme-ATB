import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Reuse the client across warm serverless invocations to avoid exhausting
// Postgres connections (see DATABASE_URL note in .env.example re: pgbouncer).
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

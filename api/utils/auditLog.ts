import { prisma } from './prisma'

// Shared helper so every admin-authored mutation writes an AuditLog row the
// same way (SECURITY.md: "Les actions administratives doivent être
// enregistrées"). Action names follow DATABASE.md's convention —
// SCREAMING_SNAKE_CASE, past tense (USER_BANNED, EVENT_CREATED, ...).
export async function logAdminAction(
  adminId: string,
  action: string,
  targetId?: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: { adminId, action, targetId },
  })
}

import { describe, expect, it } from 'vitest'
import { userBanSchema, userRoleUpdateSchema, userStatusUpdateSchema } from './user.js'

describe('userStatusUpdateSchema', () => {
  it.each(['ACTIVE', 'PENDING', 'BANNED'])('accepts %s', (status) => {
    expect(userStatusUpdateSchema.safeParse({ status }).success).toBe(true)
  })

  it('rejects a status not in the enum (e.g. "SUSPENDED" — no such state exists)', () => {
    expect(userStatusUpdateSchema.safeParse({ status: 'SUSPENDED' }).success).toBe(false)
  })

  it('rejects a missing status', () => {
    expect(userStatusUpdateSchema.safeParse({}).success).toBe(false)
  })
})

describe('userRoleUpdateSchema', () => {
  it.each(['USER', 'ADMIN'])('accepts %s', (role) => {
    expect(userRoleUpdateSchema.safeParse({ role }).success).toBe(true)
  })

  it('rejects a role not in the enum', () => {
    expect(userRoleUpdateSchema.safeParse({ role: 'SUPERADMIN' }).success).toBe(false)
  })

  it('rejects a non-string role', () => {
    expect(userRoleUpdateSchema.safeParse({ role: 1 }).success).toBe(false)
  })

  it('rejects a missing role', () => {
    expect(userRoleUpdateSchema.safeParse({}).success).toBe(false)
  })
})

describe('userBanSchema', () => {
  it('accepts a valid reason', () => {
    const result = userBanSchema.safeParse({ reason: 'Comportement inapproprié' })
    expect(result.success).toBe(true)
  })

  it('strips HTML tags from the reason', () => {
    const result = userBanSchema.safeParse({ reason: '<script>alert(1)</script>Spam' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reason).toBe('alert(1)Spam')
    }
  })

  it('rejects a reason shorter than the minimum', () => {
    expect(userBanSchema.safeParse({ reason: 'ab' }).success).toBe(false)
  })

  it('rejects a reason that is only markup, post-strip', () => {
    expect(userBanSchema.safeParse({ reason: '<b></b>' }).success).toBe(false)
  })
})

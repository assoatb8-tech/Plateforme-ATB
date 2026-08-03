import { describe, expect, it } from 'vitest'
import { bureauMemberCreateSchema } from './bureau.js'

const validMember = {
  firstName: 'Amine',
  lastName: 'Ben Salah',
  phone: '21234567',
  email: 'amine@example.com',
  facebookUrl: 'https://facebook.com/amine.bensalah',
}

describe('bureauMemberCreateSchema', () => {
  it('accepts a fully valid member', () => {
    expect(bureauMemberCreateSchema.safeParse(validMember).success).toBe(true)
  })

  it('accepts a phone with the +216 country code', () => {
    const result = bureauMemberCreateSchema.safeParse({ ...validMember, phone: '+21621234567' })
    expect(result.success).toBe(true)
  })

  it('rejects a phone with the wrong digit count', () => {
    expect(bureauMemberCreateSchema.safeParse({ ...validMember, phone: '123' }).success).toBe(false)
  })

  it('strips HTML tags from the name fields', () => {
    const result = bureauMemberCreateSchema.safeParse({
      ...validMember,
      firstName: '<script>alert(1)</script>Amine',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.firstName).toBe('alert(1)Amine')
    }
  })

  it('rejects a firstName shorter than the minimum, post-strip', () => {
    const result = bureauMemberCreateSchema.safeParse({ ...validMember, firstName: '<b>a</b>' })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed email', () => {
    expect(
      bureauMemberCreateSchema.safeParse({ ...validMember, email: 'not-an-email' }).success,
    ).toBe(false)
  })

  it('rejects a non-URL facebookUrl', () => {
    const result = bureauMemberCreateSchema.safeParse({ ...validMember, facebookUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing field', () => {
    const { email: _omit, ...withoutEmail } = validMember
    expect(bureauMemberCreateSchema.safeParse(withoutEmail).success).toBe(false)
  })
})

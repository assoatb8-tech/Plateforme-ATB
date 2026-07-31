import { describe, expect, it } from 'vitest'
import { memberProfileInputSchema } from './memberProfile.js'

const validProfile = {
  fullName: 'Adherent Test QA',
  address: '12 Rue de la Liberté, Tunis',
  phoneMobile: '21234567',
  bloodType: undefined,
  declarationAccepted: true as const,
}

describe('memberProfileInputSchema', () => {
  it('accepts the minimal valid profile (only required fields)', () => {
    const result = memberProfileInputSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it('accepts a mobile phone with the +216 country code', () => {
    const result = memberProfileInputSchema.safeParse({
      ...validProfile,
      phoneMobile: '+21621234567',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a mobile phone with the wrong digit count', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, phoneMobile: '123' })
    expect(result.success).toBe(false)
  })

  it('rejects a mobile phone containing letters', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, phoneMobile: '2123456a' })
    expect(result.success).toBe(false)
  })

  it('rejects a fullName shorter than the minimum', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, fullName: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects an address shorter than the minimum', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, address: 'x' })
    expect(result.success).toBe(false)
  })

  it('requires declarationAccepted to be literally true, not just truthy', () => {
    const result = memberProfileInputSchema.safeParse({
      ...validProfile,
      declarationAccepted: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing declarationAccepted', () => {
    const { declarationAccepted: _omit, ...withoutDeclaration } = validProfile
    const result = memberProfileInputSchema.safeParse(withoutDeclaration)
    expect(result.success).toBe(false)
  })

  it('strips HTML tags from sanitized text fields', () => {
    const result = memberProfileInputSchema.safeParse({
      ...validProfile,
      fullName: '<script>alert(1)</script>Real Name',
      fatherName: '<b>Father</b>',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('alert(1)Real Name')
      expect(result.data.fatherName).toBe('Father')
    }
  })

  it('accepts a valid 8-digit CIN number', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, cinNumber: '12345678' })
    expect(result.success).toBe(true)
  })

  it('rejects a CIN number with the wrong digit count', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, cinNumber: '123' })
    expect(result.success).toBe(false)
  })

  it('treats an empty-string enum select (gender) as unset rather than invalid', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, gender: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.gender).toBeUndefined()
    }
  })

  it('rejects an invalid enum value for gender', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, gender: 'OTHER' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid contactEmail', () => {
    const result = memberProfileInputSchema.safeParse({
      ...validProfile,
      contactEmail: 'test@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a malformed contactEmail', () => {
    const result = memberProfileInputSchema.safeParse({
      ...validProfile,
      contactEmail: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a negative childrenCount', () => {
    const result = memberProfileInputSchema.safeParse({ ...validProfile, childrenCount: -1 })
    expect(result.success).toBe(false)
  })
})

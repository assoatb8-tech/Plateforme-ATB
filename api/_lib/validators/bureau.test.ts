import { describe, expect, it } from 'vitest'
import { bureauMemberCreateSchema, bureauMemberUpdateSchema } from './bureau.js'

const validInput = {
  userId: '9c858901-8a57-4791-81fe-4c455b099bc9',
  positionFr: 'Président',
  positionAr: 'رئيس',
  facebookUrl: 'https://facebook.com/amine.bensalah',
}

describe('bureauMemberCreateSchema', () => {
  it('accepts a fully valid input', () => {
    expect(bureauMemberCreateSchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects a non-UUID userId', () => {
    const result = bureauMemberCreateSchema.safeParse({ ...validInput, userId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects a positionFr shorter than the minimum', () => {
    const result = bureauMemberCreateSchema.safeParse({ ...validInput, positionFr: 'P' })
    expect(result.success).toBe(false)
  })

  it('strips HTML tags from position fields', () => {
    const result = bureauMemberCreateSchema.safeParse({
      ...validInput,
      positionFr: '<script>alert(1)</script>Président',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.positionFr).toBe('alert(1)Président')
    }
  })

  it('rejects a non-URL facebookUrl', () => {
    const result = bureauMemberCreateSchema.safeParse({ ...validInput, facebookUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing field', () => {
    const { facebookUrl: _omit, ...withoutFacebook } = validInput
    expect(bureauMemberCreateSchema.safeParse(withoutFacebook).success).toBe(false)
  })
})

describe('bureauMemberUpdateSchema', () => {
  const { userId: _omit, ...validUpdate } = validInput

  it('accepts a valid update without userId', () => {
    expect(bureauMemberUpdateSchema.safeParse(validUpdate).success).toBe(true)
  })

  it('rejects a userId being passed (not part of the update shape)', () => {
    const result = bureauMemberUpdateSchema.safeParse(validUpdate)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('userId')
    }
  })

  it('rejects a missing positionAr', () => {
    const { positionAr: _omitPosition, ...withoutPosition } = validUpdate
    expect(bureauMemberUpdateSchema.safeParse(withoutPosition).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { bureauMemberCreateSchema } from './bureau.js'

const validInput = {
  userId: '9c858901-8a57-4791-81fe-4c455b099bc9',
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

  it('rejects a non-URL facebookUrl', () => {
    const result = bureauMemberCreateSchema.safeParse({ ...validInput, facebookUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing field', () => {
    const { facebookUrl: _omit, ...withoutFacebook } = validInput
    expect(bureauMemberCreateSchema.safeParse(withoutFacebook).success).toBe(false)
  })
})

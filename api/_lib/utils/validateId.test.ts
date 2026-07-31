import { describe, expect, it } from 'vitest'
import { isValidUuid } from './validateId.js'

describe('isValidUuid', () => {
  it('accepts a well-formed v4 UUID', () => {
    expect(isValidUuid('dc43bec9-3082-48c2-bd33-715f84302b13')).toBe(true)
  })

  it('accepts uppercase hex digits', () => {
    expect(isValidUuid('DC43BEC9-3082-48C2-BD33-715F84302B13')).toBe(true)
  })

  it('rejects a plainly invalid string', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidUuid('')).toBe(false)
  })

  it('rejects a UUID missing a hyphen group', () => {
    expect(isValidUuid('dc43bec9-3082-48c2-715f84302b13')).toBe(false)
  })

  it('rejects a UUID with a SQL-injection-shaped payload appended', () => {
    expect(isValidUuid("dc43bec9-3082-48c2-bd33-715f84302b13' OR '1'='1")).toBe(false)
  })

  it('rejects a numeric id', () => {
    expect(isValidUuid('12345')).toBe(false)
  })
})

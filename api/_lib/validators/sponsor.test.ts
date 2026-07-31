import { describe, expect, it } from 'vitest'
import { sponsorCreateSchema } from './sponsor.js'

describe('sponsorCreateSchema', () => {
  it('accepts a valid sponsor', () => {
    const result = sponsorCreateSchema.safeParse({
      name: 'ATB Partenaire',
      logoUrl:
        'https://xkwkriungduowommdrno.supabase.co/storage/v1/object/public/sponsor-logos/logo.jpeg',
    })
    expect(result.success).toBe(true)
  })

  it('strips HTML tags from the name', () => {
    const result = sponsorCreateSchema.safeParse({
      name: '<script>alert(1)</script>Sponsor',
      logoUrl: 'https://example.com/logo.png',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('alert(1)Sponsor')
    }
  })

  it('rejects a name shorter than the minimum', () => {
    const result = sponsorCreateSchema.safeParse({
      name: 'A',
      logoUrl: 'https://example.com/logo.png',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-URL logoUrl — the admin UI only ever sends the public URL from a real upload, never free text', () => {
    const result = sponsorCreateSchema.safeParse({ name: 'ATB', logoUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing logoUrl', () => {
    const result = sponsorCreateSchema.safeParse({ name: 'ATB' })
    expect(result.success).toBe(false)
  })
})

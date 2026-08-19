import { describe, expect, it } from 'vitest'
import { eventAttendanceSchema, eventCreateSchema, eventUpdateSchema } from './event.js'

const validEvent = {
  titleFr: 'Nettoyage de plage',
  titleAr: 'تنظيف الشاطئ',
  descriptionFr: 'Journée de nettoyage.',
  descriptionAr: 'يوم تنظيف.',
  location: 'Sousse',
  startDate: '2026-09-01T09:00:00.000Z',
  endDate: '2026-09-01T12:00:00.000Z',
  maxParticipants: 20,
  facebookPostUrl: undefined,
}

describe('eventCreateSchema', () => {
  it('accepts a fully valid event', () => {
    const result = eventCreateSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
  })

  it('strips HTML tags from every text field', () => {
    const result = eventCreateSchema.safeParse({
      ...validEvent,
      titleFr: '<script>alert(1)</script>XSS Test',
      descriptionFr: '<img src=x onerror=alert(1)>Description test',
      location: '<b>Location</b> test',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.titleFr).toBe('alert(1)XSS Test')
      expect(result.data.descriptionFr).toBe('Description test')
      expect(result.data.location).toBe('Location test')
    }
  })

  it('rejects when endDate is before startDate', () => {
    const result = eventCreateSchema.safeParse({
      ...validEvent,
      startDate: '2026-09-02T09:00:00.000Z',
      endDate: '2026-09-01T09:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('accepts endDate equal to startDate', () => {
    const result = eventCreateSchema.safeParse({
      ...validEvent,
      startDate: '2026-09-01T09:00:00.000Z',
      endDate: '2026-09-01T09:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unparseable date string', () => {
    const result = eventCreateSchema.safeParse({ ...validEvent, startDate: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('rejects a title shorter than the minimum, post-strip', () => {
    // "<b>a</b>" strips down to just "a" — must fail the min(2) check
    // against the stripped content, not the raw tag-inflated length.
    const result = eventCreateSchema.safeParse({ ...validEvent, titleFr: '<b>a</b>' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive maxParticipants', () => {
    const result = eventCreateSchema.safeParse({ ...validEvent, maxParticipants: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects a non-integer maxParticipants', () => {
    const result = eventCreateSchema.safeParse({ ...validEvent, maxParticipants: 2.5 })
    expect(result.success).toBe(false)
  })

  it('rejects a wrong-type maxParticipants', () => {
    const result = eventCreateSchema.safeParse({ ...validEvent, maxParticipants: '20' })
    expect(result.success).toBe(false)
  })

  it('resolves an omitted facebookPostUrl to null, never undefined', () => {
    const { facebookPostUrl: _omit, ...withoutFbUrl } = validEvent
    const result = eventCreateSchema.safeParse(withoutFbUrl)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.facebookPostUrl).toBeNull()
    }
  })

  it('resolves an empty-string facebookPostUrl to null', () => {
    const result = eventCreateSchema.safeParse({ ...validEvent, facebookPostUrl: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.facebookPostUrl).toBeNull()
    }
  })

  it('rejects a malformed facebookPostUrl', () => {
    const result = eventCreateSchema.safeParse({ ...validEvent, facebookPostUrl: 'not a url' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid facebookPostUrl', () => {
    const result = eventCreateSchema.safeParse({
      ...validEvent,
      facebookPostUrl: 'https://facebook.com/atb/posts/123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.facebookPostUrl).toBe('https://facebook.com/atb/posts/123')
    }
  })
})

describe('eventUpdateSchema', () => {
  it('accepts a partial update with a single field', () => {
    const result = eventUpdateSchema.safeParse({ maxParticipants: 30 })
    expect(result.success).toBe(true)
  })

  it('accepts an empty object (no-op update)', () => {
    const result = eventUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a status transition to CANCELLED', () => {
    const result = eventUpdateSchema.safeParse({ status: 'CANCELLED' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid status value', () => {
    const result = eventUpdateSchema.safeParse({ status: 'DELETED' })
    expect(result.success).toBe(false)
  })

  it('still enforces the date-order check when both dates are present', () => {
    const result = eventUpdateSchema.safeParse({
      startDate: '2026-09-02T09:00:00.000Z',
      endDate: '2026-09-01T09:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('eventAttendanceSchema', () => {
  const registrationId = '11111111-1111-1111-1111-111111111111'

  it('accepts a PRESENT mark', () => {
    const result = eventAttendanceSchema.safeParse({ registrationId, status: 'PRESENT' })
    expect(result.success).toBe(true)
  })

  it('accepts an ABSENT mark', () => {
    const result = eventAttendanceSchema.safeParse({ registrationId, status: 'ABSENT' })
    expect(result.success).toBe(true)
  })

  it('accepts an explicit null to clear a mark', () => {
    const result = eventAttendanceSchema.safeParse({ registrationId, status: null })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid status value', () => {
    const result = eventAttendanceSchema.safeParse({ registrationId, status: 'LATE' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing status key', () => {
    const result = eventAttendanceSchema.safeParse({ registrationId })
    expect(result.success).toBe(false)
  })

  it('rejects a non-UUID registrationId', () => {
    const result = eventAttendanceSchema.safeParse({ registrationId: 'not-a-uuid', status: null })
    expect(result.success).toBe(false)
  })
})

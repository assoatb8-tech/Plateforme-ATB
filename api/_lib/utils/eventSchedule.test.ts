import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeEventDateRange, parseTunisDateTime, tunisDayBounds } from './eventSchedule.js'

describe('parseTunisDateTime', () => {
  it('interprets a naive datetime-local string as Africa/Tunis (UTC+1)', () => {
    const date = parseTunisDateTime('2026-09-05T09:00')
    expect(date.toISOString()).toBe('2026-09-05T08:00:00.000Z')
  })

  it('leaves a string that already carries a Z suffix untouched', () => {
    const date = parseTunisDateTime('2026-09-05T09:00:00.000Z')
    expect(date.toISOString()).toBe('2026-09-05T09:00:00.000Z')
  })

  it('leaves a string that already carries an explicit offset untouched', () => {
    const date = parseTunisDateTime('2026-09-05T09:00:00+02:00')
    expect(date.toISOString()).toBe('2026-09-05T07:00:00.000Z')
  })
})

describe('tunisDayBounds', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the UTC instant range covering tomorrow in Tunis local time', () => {
    // Midday UTC, well clear of the Tunis midnight boundary either side.
    vi.setSystemTime(new Date('2026-09-09T12:00:00.000Z'))
    const { start, end } = tunisDayBounds(1)
    // Tunis midnight (00:00 +01:00) on 2026-09-10 is 2026-09-09T23:00:00Z.
    expect(start.toISOString()).toBe('2026-09-09T23:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-10T23:00:00.000Z')
  })

  it('always spans exactly 24 hours', () => {
    vi.setSystemTime(new Date('2026-01-15T05:30:00.000Z'))
    const { start, end } = tunisDayBounds(0)
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000)
  })
})

describe('computeEventDateRange', () => {
  it('derives startDate/endDate as the min/max across the given days', () => {
    const range = computeEventDateRange([
      {
        startAt: new Date('2026-09-10T08:00:00.000Z'),
        endAt: new Date('2026-09-10T15:00:00.000Z'),
      },
      {
        startAt: new Date('2026-09-11T08:00:00.000Z'),
        endAt: new Date('2026-09-11T15:00:00.000Z'),
      },
    ])
    expect(range.startDate.toISOString()).toBe('2026-09-10T08:00:00.000Z')
    expect(range.endDate.toISOString()).toBe('2026-09-11T15:00:00.000Z')
  })
})

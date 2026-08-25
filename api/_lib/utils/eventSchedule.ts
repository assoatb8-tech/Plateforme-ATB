interface EventDayRange {
  startAt: Date
  endAt: Date
}

// Africa/Tunis has been a fixed UTC+1 year-round since Tunisia stopped
// observing DST in 2009 — safe to hard-code rather than pull in a timezone
// library for a single-country app.
const TUNIS_OFFSET_MS = 60 * 60 * 1000

// The admin/member-facing forms always submit naive "YYYY-MM-DDTHH:mm"
// strings (no timezone) straight from <input type="datetime-local">/"time">
// fields — the wall-clock time the person actually typed, always meant as
// Tunis local time. Parsing a naive string with the bare `Date` constructor
// interprets it in whatever timezone the CURRENT RUNTIME happens to be in,
// which for a Vercel function is UTC, not Tunis — silently shifting every
// stored time by an hour from what was entered. Pinning the offset here
// (rather than trusting either the client's or the server's ambient
// timezone) keeps it correct regardless of where this code executes.
export function parseTunisDateTime(naive: string): Date {
  return /[Zz]|[+-]\d{2}:?\d{2}$/.test(naive) ? new Date(naive) : new Date(`${naive}+01:00`)
}

// The half-open [start, end) UTC instant range covering one Tunis calendar
// day, `daysFromToday` days from now (0 = today, 1 = tomorrow) — used to
// find events/days that fall on a given Tunis-local date regardless of the
// server's own timezone.
export function tunisDayBounds(daysFromToday: number): { start: Date; end: Date } {
  const nowTunis = new Date(Date.now() + TUNIS_OFFSET_MS)
  const y = nowTunis.getUTCFullYear()
  const m = nowTunis.getUTCMonth()
  const d = nowTunis.getUTCDate() + daysFromToday
  return {
    start: new Date(Date.UTC(y, m, d) - TUNIS_OFFSET_MS),
    end: new Date(Date.UTC(y, m, d + 1) - TUNIS_OFFSET_MS),
  }
}

// A multi-day event never has its own startDate/endDate submitted by the
// client — both are always derived (min/max across `days`) so every
// existing query/sort/status-computation (event list filtering, the
// computed "Terminé" status, EventCard's date display) keeps working
// unchanged regardless of how many days the event actually has.
export function computeEventDateRange(days: EventDayRange[]): { startDate: Date; endDate: Date } {
  const starts = days.map((day) => day.startAt.getTime())
  const ends = days.map((day) => day.endAt.getTime())
  return { startDate: new Date(Math.min(...starts)), endDate: new Date(Math.max(...ends)) }
}

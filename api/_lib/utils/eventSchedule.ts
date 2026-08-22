interface EventDayRange {
  startAt: Date
  endAt: Date
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

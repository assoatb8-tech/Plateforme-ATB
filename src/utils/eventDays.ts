// Shared by the admin and "chef de groupe" participants tables — a
// compact, sorted list of the dates a participant picked for a multi-day
// event (e.g. "12 sept., 14 sept.").
export function formatSelectedDays(
  daySelections: { eventDay: { startAt: string } }[],
  locale: string,
): string {
  return daySelections
    .map((selection) => new Date(selection.eventDay.startAt))
    .sort((a, b) => a.getTime() - b.getTime())
    .map((date) => date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }))
    .join(', ')
}

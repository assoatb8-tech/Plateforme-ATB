// Every event schedule display (as opposed to incidental metadata like a
// registration timestamp) is pinned to Africa/Tunis rather than the
// viewer's own device timezone — an admin's or member's browser can be set
// to anything, but the association's events always happen in Tunis local
// time, and everyone should see the same wall-clock time the organizer
// actually entered.
export const TUNIS_TIMEZONE = 'Africa/Tunis'

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
    .map((date) =>
      date.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: TUNIS_TIMEZONE }),
    )
    .join(', ')
}

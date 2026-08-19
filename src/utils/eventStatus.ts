import type { EventStatus } from '@/features/events/types'

export type EffectiveEventStatus = EventStatus | 'DONE'

// "Terminé" isn't a real stored status — EventStatus is only ever
// ACTIVE/CANCELLED in the DB, set explicitly by an admin. Whether an
// active event has already happened is fully derivable from endDate vs.
// now, so it's computed here for display rather than persisted: no cron
// job needed to flip a stored value, and no drift between "what the DB
// says" and "what's actually true" while nothing checks in for a day.
export function getEffectiveEventStatus(event: {
  status: EventStatus
  endDate: string
}): EffectiveEventStatus {
  if (event.status === 'CANCELLED') return 'CANCELLED'
  if (new Date(event.endDate) < new Date()) return 'DONE'
  return 'ACTIVE'
}

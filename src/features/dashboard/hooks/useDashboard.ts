import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser } from '@/features/auth/services/authService'
import { fetchMyRegistrations } from '@/features/events/services/eventsService'

export function useCurrentUserProfile() {
  return useQuery({ queryKey: ['auth', 'me'], queryFn: fetchCurrentUser })
}

// Same query key as the events feature's cancel-registration invalidation
// (src/features/events/hooks/useEvents.ts) so cancelling from an event
// detail page also refreshes the dashboard/participations lists.
export function useMyRegistrations() {
  return useQuery({ queryKey: ['registrations'], queryFn: fetchMyRegistrations })
}

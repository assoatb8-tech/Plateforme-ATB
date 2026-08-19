import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelEventRegistration,
  fetchEvent,
  fetchEventParticipants,
  fetchEvents,
  fetchMyLedEvents,
  registerForEvent,
  setAttendance,
} from '@/features/events/services/eventsService'
import type { AttendanceStatus, EventTense } from '@/features/events/types'

export const eventsKeys = {
  all: ['events'] as const,
  list: (page: number, search: string, when: EventTense) =>
    ['events', 'list', page, search, when] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
}

export function useEventsList(page: number, search: string, when: EventTense) {
  return useQuery({
    queryKey: eventsKeys.list(page, search, when),
    queryFn: () => fetchEvents({ page, search, when }),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: eventsKeys.detail(id ?? ''),
    queryFn: () => fetchEvent(id as string),
    enabled: Boolean(id),
  })
}

function useInvalidateEventQueries(id: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: eventsKeys.detail(id) })
    void queryClient.invalidateQueries({ queryKey: eventsKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['registrations'] })
  }
}

export function useRegisterForEvent(id: string) {
  const invalidate = useInvalidateEventQueries(id)
  return useMutation({
    mutationFn: () => registerForEvent(id),
    onSuccess: invalidate,
  })
}

export function useCancelEventRegistration(id: string) {
  const invalidate = useInvalidateEventQueries(id)
  return useMutation({
    mutationFn: () => cancelEventRegistration(id),
    onSuccess: invalidate,
  })
}

// Events the current user leads ("chef de groupe") — used by the member
// dashboard to surface an attendance-marking entry point.
export function useMyLedEvents() {
  return useQuery({ queryKey: ['events', 'ledByMe'], queryFn: fetchMyLedEvents })
}

// ADMIN or the event's own leader (enforced server-side) — the same query
// key prefix as `eventsKeys` so the existing leader-assignment mutation's
// broad `['events']` invalidation also refreshes this list.
export function useEventParticipants(id: string | undefined) {
  return useQuery({
    queryKey: ['events', 'participants', id ?? ''],
    queryFn: () => fetchEventParticipants(id as string),
    enabled: Boolean(id),
  })
}

export function useSetAttendance(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      registrationId,
      status,
    }: {
      registrationId: string
      status: AttendanceStatus | null
    }) => setAttendance(eventId, registrationId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', 'participants', eventId] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

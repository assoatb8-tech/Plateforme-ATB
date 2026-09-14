import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  addParticipant,
  cancelEventRegistration,
  editParticipant,
  fetchEvent,
  fetchEventParticipants,
  fetchEvents,
  fetchMyLedEvents,
  registerForEvent,
  removeParticipant,
  setAttendance,
  updateMyEventDays,
} from '@/features/events/services/eventsService'
import type {
  AttendanceStatus,
  EventSort,
  EventTense,
  RegistrationStatus,
} from '@/features/events/types'

export const eventsKeys = {
  all: ['events'] as const,
  list: (page: number, search: string, when: EventTense, sort: EventSort) =>
    ['events', 'list', page, search, when, sort] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
}

export function useEventsList(
  page: number,
  search: string,
  when: EventTense,
  sort: EventSort = 'default',
) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: eventsKeys.list(page, search, when, sort),
    queryFn: () => fetchEvents({ page, search, when, sort, lang: i18n.language }),
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
    mutationFn: (dayIds?: string[]) => registerForEvent(id, dayIds),
    onSuccess: invalidate,
  })
}

// Changing which day(s) an already-registered member intends to attend.
export function useUpdateMyEventDays(id: string) {
  const invalidate = useInvalidateEventQueries(id)
  return useMutation({
    mutationFn: (dayIds: string[]) => updateMyEventDays(id, dayIds),
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

// Shared invalidation for the three participant-management mutations below
// — the participants list itself, plus the event (registeredCount/spotsLeft
// changed) and the admin dashboard's registration stat.
function useInvalidateParticipantQueries(eventId: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['events', 'participants', eventId] })
    void queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId) })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
  }
}

// ADMIN only — registers a member on the event's behalf.
export function useAddParticipant(eventId: string) {
  const invalidate = useInvalidateParticipantQueries(eventId)
  return useMutation({
    mutationFn: ({ userId, dayIds }: { userId: string; dayIds?: string[] }) =>
      addParticipant(eventId, userId, dayIds),
    onSuccess: invalidate,
  })
}

// ADMIN only — corrects a participant's status and/or day selection.
export function useEditParticipant(eventId: string) {
  const invalidate = useInvalidateParticipantQueries(eventId)
  return useMutation({
    mutationFn: ({
      registrationId,
      ...updates
    }: {
      registrationId: string
      status?: RegistrationStatus
      dayIds?: string[]
    }) => editParticipant(eventId, registrationId, updates),
    onSuccess: invalidate,
  })
}

// ADMIN (any time) or the event's own leader ("chef de groupe", only before
// the event starts — enforced server-side).
export function useRemoveParticipant(eventId: string) {
  const invalidate = useInvalidateParticipantQueries(eventId)
  return useMutation({
    mutationFn: (registrationId: string) => removeParticipant(eventId, registrationId),
    onSuccess: invalidate,
  })
}

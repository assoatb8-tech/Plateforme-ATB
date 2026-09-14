import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  assignEventLeader,
  createEvent,
  deleteEvent,
  fetchAdminEvent,
  fetchAdminEvents,
  updateEvent,
} from '@/features/admin/events/services/adminEventsService'
import type { EventSubmitPayload } from '@/features/admin/events/validation'
import type { EventSort } from '@/features/events/types'

export const adminEventsKeys = {
  all: ['admin', 'events'] as const,
  list: (page: number, search: string, sort: EventSort) =>
    ['admin', 'events', 'list', page, search, sort] as const,
  detail: (id: string) => ['admin', 'events', 'detail', id] as const,
}

export function useAdminEventsList(page: number, search: string, sort: EventSort = 'default') {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: adminEventsKeys.list(page, search, sort),
    queryFn: () => fetchAdminEvents({ page, search, sort, lang: i18n.language }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminEvent(id: string | undefined) {
  return useQuery({
    queryKey: adminEventsKeys.detail(id ?? ''),
    queryFn: () => fetchAdminEvent(id as string),
    enabled: Boolean(id),
  })
}

// Also invalidates the public events list/registrations queries — an admin
// create/update/delete must be reflected there too, not just in /admin.
function useInvalidateAdminEventQueries() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminEventsKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['events'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
  }
}

export function useCreateEvent() {
  const invalidate = useInvalidateAdminEventQueries()
  return useMutation({
    mutationFn: (values: EventSubmitPayload) => createEvent(values),
    onSuccess: invalidate,
  })
}

export function useUpdateEvent(id: string) {
  const invalidate = useInvalidateAdminEventQueries()
  return useMutation({
    mutationFn: (values: EventSubmitPayload) => updateEvent(id, values),
    onSuccess: invalidate,
  })
}

export function useDeleteEvent() {
  const invalidate = useInvalidateAdminEventQueries()
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: invalidate,
  })
}

export function useAssignEventLeader(eventId: string) {
  const invalidate = useInvalidateAdminEventQueries()
  return useMutation({
    mutationFn: (userId: string | null) => assignEventLeader(eventId, userId),
    onSuccess: invalidate,
  })
}

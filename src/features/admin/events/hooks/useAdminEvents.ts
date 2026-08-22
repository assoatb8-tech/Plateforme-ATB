import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignEventLeader,
  createEvent,
  deleteEvent,
  fetchAdminEvent,
  fetchAdminEvents,
  updateEvent,
} from '@/features/admin/events/services/adminEventsService'
import type { EventSubmitPayload } from '@/features/admin/events/validation'

export const adminEventsKeys = {
  all: ['admin', 'events'] as const,
  list: (page: number, search: string) => ['admin', 'events', 'list', page, search] as const,
  detail: (id: string) => ['admin', 'events', 'detail', id] as const,
}

export function useAdminEventsList(page: number, search: string) {
  return useQuery({
    queryKey: adminEventsKeys.list(page, search),
    queryFn: () => fetchAdminEvents({ page, search }),
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

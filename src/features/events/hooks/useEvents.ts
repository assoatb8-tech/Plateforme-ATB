import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelEventRegistration,
  fetchEvent,
  fetchEvents,
  registerForEvent,
} from '@/features/events/services/eventsService'

export const eventsKeys = {
  all: ['events'] as const,
  list: (page: number, search: string) => ['events', 'list', page, search] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
}

export function useEventsList(page: number, search: string) {
  return useQuery({
    queryKey: eventsKeys.list(page, search),
    queryFn: () => fetchEvents({ page, search }),
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

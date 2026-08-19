import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/services/notificationsService'

export const notificationsKeys = {
  all: ['notifications'] as const,
}

// Polled rather than realtime (no websockets, keeping the $0 architecture
// simple) — 60s is frequent enough for "did a new event drop / did someone
// join" to feel current without hammering the function on every page.
const REFETCH_INTERVAL_MS = 60_000

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationsKeys.all,
    queryFn: fetchNotifications,
    enabled,
    refetchInterval: enabled ? REFETCH_INTERVAL_MS : false,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all })
    },
  })
}

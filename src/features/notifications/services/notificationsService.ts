import { apiRequest } from '@/services/apiClient'
import type { NotificationDto, NotificationsResponse } from '@/features/notifications/types'

export async function fetchNotifications(): Promise<NotificationsResponse> {
  return apiRequest<NotificationsResponse>('/api/notifications')
}

export async function markNotificationRead(id: string): Promise<NotificationDto> {
  return apiRequest<NotificationDto>('/api/notifications', {
    method: 'PATCH',
    query: { id },
  })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest('/api/notifications', {
    method: 'PATCH',
    query: { action: 'read-all' },
  })
}

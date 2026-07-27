import { apiRequest } from '@/services/apiClient'
import type { EventDto, EventsListResponse, RegistrationDto } from '@/features/events/types'

export async function fetchEvents(params: {
  page?: number
  search?: string
}): Promise<EventsListResponse> {
  return apiRequest<EventsListResponse>('/api/events', {
    requireAuth: false,
    query: { page: params.page, search: params.search },
  })
}

export async function fetchEvent(id: string): Promise<EventDto> {
  return apiRequest<EventDto>(`/api/events/${id}`, { requireAuth: false })
}

export async function registerForEvent(id: string): Promise<void> {
  await apiRequest(`/api/events/${id}/register`, { method: 'POST' })
}

export async function cancelEventRegistration(id: string): Promise<void> {
  await apiRequest(`/api/events/${id}/register`, { method: 'DELETE' })
}

export async function fetchMyRegistrations(): Promise<RegistrationDto[]> {
  return apiRequest<RegistrationDto[]>('/api/registrations')
}

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
  await apiRequest(`/api/events/${id}`, { method: 'POST', query: { action: 'register' } })
}

export async function cancelEventRegistration(id: string): Promise<void> {
  await apiRequest(`/api/events/${id}`, { method: 'DELETE', query: { action: 'register' } })
}

export async function fetchMyRegistrations(): Promise<RegistrationDto[]> {
  return apiRequest<RegistrationDto[]>('/api/registrations')
}

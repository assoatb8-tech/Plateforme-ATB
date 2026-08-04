import { apiRequest } from '@/services/apiClient'
import type { EventDto, EventsListResponse, RegistrationStatus } from '@/features/events/types'
import type { EventFormValues } from '@/features/admin/events/validation'

export interface EventParticipantDto {
  id: string
  status: RegistrationStatus
  registeredAt: string
  user: {
    id: string
    email: string
    memberProfile: {
      firstNameFr: string
      lastNameFr: string
      firstNameAr: string
      lastNameAr: string
      phoneMobile: string
      photoUrl: string | null
    } | null
  }
}

// `all: 'true'` is honored by GET /api/events only for authenticated ADMIN
// callers (checked server-side) — see api/events.ts. Without it, cancelled
// events would be invisible to this page.
export async function fetchAdminEvents(params: {
  page?: number
  search?: string
}): Promise<EventsListResponse> {
  return apiRequest<EventsListResponse>('/api/events', {
    query: { page: params.page, search: params.search, all: 'true' },
  })
}

export async function fetchAdminEvent(id: string): Promise<EventDto> {
  return apiRequest<EventDto>(`/api/events/${id}`)
}

export async function createEvent(values: EventFormValues): Promise<EventDto> {
  return apiRequest<EventDto>('/api/events', { method: 'POST', body: values })
}

export async function updateEvent(id: string, values: EventFormValues): Promise<EventDto> {
  return apiRequest<EventDto>(`/api/events/${id}`, { method: 'PATCH', body: values })
}

export async function deleteEvent(id: string): Promise<void> {
  await apiRequest(`/api/events/${id}`, { method: 'DELETE' })
}

export async function fetchEventParticipants(id: string): Promise<EventParticipantDto[]> {
  return apiRequest<EventParticipantDto[]>(`/api/events/${id}`, {
    query: { action: 'participants' },
  })
}

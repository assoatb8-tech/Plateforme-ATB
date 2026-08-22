import { apiRequest } from '@/services/apiClient'
import type {
  AttendanceStatus,
  EventDto,
  EventParticipantDto,
  EventsListResponse,
  EventTense,
  RegistrationDto,
} from '@/features/events/types'

export async function fetchEvents(params: {
  page?: number
  search?: string
  when?: EventTense
}): Promise<EventsListResponse> {
  return apiRequest<EventsListResponse>('/api/events', {
    requireAuth: false,
    query: { page: params.page, search: params.search, when: params.when },
  })
}

export async function fetchEvent(id: string): Promise<EventDto> {
  return apiRequest<EventDto>(`/api/events/${id}`, { requireAuth: false })
}

// dayIds: only meaningful (and required server-side) for a multi-day
// event — ignored otherwise, so a plain single-day registration still
// calls this with no argument at all.
export async function registerForEvent(id: string, dayIds?: string[]): Promise<void> {
  await apiRequest(`/api/events/${id}`, {
    method: 'POST',
    query: { action: 'register' },
    body: dayIds ? { dayIds } : undefined,
  })
}

// Changes which day(s) an already-registered member intends to attend,
// without touching their registration/waitlist status.
export async function updateMyEventDays(id: string, dayIds: string[]): Promise<void> {
  await apiRequest(`/api/events/${id}`, {
    method: 'PATCH',
    query: { action: 'days' },
    body: { dayIds },
  })
}

export async function cancelEventRegistration(id: string): Promise<void> {
  await apiRequest(`/api/events/${id}`, { method: 'DELETE', query: { action: 'register' } })
}

export async function fetchMyRegistrations(): Promise<RegistrationDto[]> {
  return apiRequest<RegistrationDto[]>('/api/registrations')
}

// Events led by ("all=true"-equivalent, but scoped server-side to the
// caller's own leaderId) — see api/events.ts's ledByMe filter. Includes
// past/cancelled events too, since a leader needs to reach ended events to
// mark attendance.
export async function fetchMyLedEvents(): Promise<EventDto[]> {
  const response = await apiRequest<EventsListResponse>('/api/events', {
    query: { ledByMe: 'true' },
  })
  return response.events
}

// ADMIN or the event's own leader — see api/events/[id].ts's canManageEvent.
export async function fetchEventParticipants(eventId: string): Promise<EventParticipantDto[]> {
  return apiRequest<EventParticipantDto[]>(`/api/events/${eventId}`, {
    query: { action: 'participants' },
  })
}

// status: null clears a previously recorded mark. Only accepted once the
// event has ended (enforced server-side).
export async function setAttendance(
  eventId: string,
  registrationId: string,
  status: AttendanceStatus | null,
): Promise<void> {
  await apiRequest(`/api/events/${eventId}`, {
    method: 'PATCH',
    query: { action: 'attendance' },
    body: { registrationId, status },
  })
}

import { apiRequest } from '@/services/apiClient'
import { getSupabaseClient } from '@/services/supabaseClient'
import { compressToJpeg } from '@/services/imageCompression'
import type { EventDto, EventsListResponse } from '@/features/events/types'
import type { EventFormValues } from '@/features/admin/events/validation'

const BANNER_BUCKET = 'event-banners'

// Public bucket, same pattern as sponsor logos / Bureau photos — event
// banners are shown on the public events pages, no signed URL needed.
// Compressed via the shared canvas pipeline (see
// src/services/imageCompression.ts) so an admin's phone photo doesn't hit
// the same size/format wall member profile uploads used to.
export async function uploadEventBanner(file: File): Promise<string> {
  const compressed = await compressToJpeg(file)
  const supabase = await getSupabaseClient()
  const path = `${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BANNER_BUCKET)
    .upload(path, compressed, { contentType: 'image/jpeg' })
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(BANNER_BUCKET).getPublicUrl(path)
  return publicUrl
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

// userId: null unassigns the current leader.
export async function assignEventLeader(
  eventId: string,
  userId: string | null,
): Promise<{ leaderId: string | null }> {
  return apiRequest<{ leaderId: string | null }>(`/api/events/${eventId}`, {
    method: 'PATCH',
    query: { action: 'leader' },
    body: { userId },
  })
}

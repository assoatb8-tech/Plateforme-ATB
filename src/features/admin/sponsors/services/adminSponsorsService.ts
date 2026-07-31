import { apiRequest } from '@/services/apiClient'
import { getSupabaseClient } from '@/services/supabaseClient'
import type { SponsorDto } from '@/features/sponsors/types'

const BUCKET = 'sponsor-logos'

export const ALLOWED_LOGO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'svg']
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024

export function validateLogoFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_LOGO_EXTENSIONS.includes(extension)) {
    return 'admin.sponsors.uploadInvalidType'
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return 'admin.sponsors.uploadTooLarge'
  }
  return null
}

// Uploads directly to the public sponsor-logos bucket (RLS there is
// is_admin()-gated for writes — see supabase/sql/005_sponsors.sql) and
// returns the permanent public URL, which is what POST /api/sponsors
// actually stores. The API itself never touches the file.
export async function uploadSponsorLogo(file: File): Promise<string> {
  const supabase = await getSupabaseClient()
  const path = `${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}

export async function createSponsor(input: { name: string; logoUrl: string }): Promise<SponsorDto> {
  return apiRequest<SponsorDto>('/api/sponsors', { method: 'POST', body: input })
}

export async function deleteSponsor(id: string): Promise<void> {
  await apiRequest('/api/sponsors', { method: 'DELETE', query: { id } })
}

import { apiRequest } from '@/services/apiClient'
import { getSupabaseClient } from '@/services/supabaseClient'
import type { BureauMemberDto } from '@/features/bureau/types'

const BUCKET = 'bureau-photos'

export const ALLOWED_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024

export function validateBureauPhotoFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_PHOTO_EXTENSIONS.includes(extension)) {
    return 'admin.bureau.uploadInvalidType'
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return 'admin.bureau.uploadTooLarge'
  }
  return null
}

// Same public-bucket/public-URL pattern as sponsor logos — Bureau photos
// are shown on the public /bureau page, so no signed-URL round trip needed.
export async function uploadBureauPhoto(file: File): Promise<string> {
  const supabase = await getSupabaseClient()
  const path = `${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return publicUrl
}

export interface CreateBureauMemberInput {
  firstName: string
  lastName: string
  phone: string
  email: string
  facebookUrl: string
  photoUrl: string
}

export async function createBureauMember(input: CreateBureauMemberInput): Promise<BureauMemberDto> {
  return apiRequest<BureauMemberDto>('/api/bureau', { method: 'POST', body: input })
}

export async function deleteBureauMember(id: string): Promise<void> {
  await apiRequest('/api/bureau', { method: 'DELETE', query: { id } })
}

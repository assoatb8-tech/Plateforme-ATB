import { getSupabaseClient } from '@/services/supabaseClient'
import { compressToJpeg, PhotoDecodeError } from '@/services/imageCompression'

export { PhotoDecodeError }

const MEMBERS_BUCKET = 'members'

// See src/services/imageCompression.ts for why every upload gets
// decoded + downscaled + re-encoded rather than gated by extension/size.
const MAX_SOURCE_SIZE_BYTES = 20 * 1024 * 1024

export function validateProfilePhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'profile.photoInvalidType'
  }
  if (file.size > MAX_SOURCE_SIZE_BYTES) {
    return 'profile.photoTooLarge'
  }
  return null
}

// The "members" bucket is private (supabase/sql/003_storage.sql) — this
// returns the storage PATH, not a public URL. Reading it back always goes
// through getSignedProfilePhotoUrl below.
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const compressed = await compressToJpeg(file)
  const supabase = await getSupabaseClient()
  const path = `${userId}/profile/${Date.now()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(MEMBERS_BUCKET)
    .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
  if (uploadError) throw uploadError

  return path
}

// Short-lived signed URL — RLS on the bucket (members_bucket_select) lets
// the owner or an admin read it, so this works from either the adherent's
// own profile page or the admin user-detail page.
export async function getSignedProfilePhotoUrl(path: string): Promise<string | null> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.storage.from(MEMBERS_BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

// Batch version for list pages (admin members, event participants) — one
// request instead of N, same RLS as the single version above.
export async function getSignedProfilePhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.storage.from(MEMBERS_BUCKET).createSignedUrls(paths, 3600)
  if (error || !data) return {}

  const map: Record<string, string> = {}
  for (const item of data) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl
  }
  return map
}

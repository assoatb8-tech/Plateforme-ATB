import { getSupabaseClient } from '@/services/supabaseClient'

const MEMBERS_BUCKET = 'members'

// Real member phones (per Supabase storage logs: a mix of Android and
// iOS, much of it through Facebook's in-app browser) routinely produce
// 8-15 MB JPEGs or HEIC photos straight from the camera — a strict
// jpg/png-only, 5 MB client-side gate was silently rejecting a lot of
// real uploads with zero server-side trace (rejected files never reach
// the network). Fix: stop gatekeeping by extension and instead decode +
// downscale + re-encode every photo to a small JPEG in the browser
// before upload (see compressToJpeg below) — this normalizes whatever
// format the browser can decode (which covers the vast majority of real
// phone photos, HEIC included on WebKit/iOS) into something small and
// universally displayable, and the only remaining size check is a
// generous sanity cap on the ORIGINAL file so a decode attempt doesn't
// hang a low-end phone on an absurdly large source image.
const MAX_SOURCE_SIZE_BYTES = 20 * 1024 * 1024
const MAX_DIMENSION_PX = 1024
const JPEG_QUALITY = 0.85

export function validateProfilePhotoFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'profile.photoInvalidType'
  }
  if (file.size > MAX_SOURCE_SIZE_BYTES) {
    return 'profile.photoTooLarge'
  }
  return null
}

// Thrown when the browser itself can't decode the source file (e.g. HEIC
// on a non-WebKit browser, or a corrupt image) — distinct from a network/
// upload failure, since the fix is "pick a different photo" rather than
// "check your connection and retry".
export class PhotoDecodeError extends Error {}

// Decodes via <img>, downscales onto a <canvas> (longest side capped at
// MAX_DIMENSION_PX), and re-encodes as JPEG.
async function compressToJpeg(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new PhotoDecodeError('Unable to decode image'))
      img.src = objectUrl
    })

    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    if (!blob) throw new PhotoDecodeError('Unable to encode image')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
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

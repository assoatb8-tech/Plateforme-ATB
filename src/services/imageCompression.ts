// Shared by every "upload a photo from a phone" flow in the app (member
// profile photos, event banners): decode via <img>, downscale onto a
// <canvas>, re-encode as JPEG. Real member phones (per Supabase storage
// logs) routinely produce 8-15 MB JPEGs or HEIC straight from the camera —
// normalizing everything to a small JPEG client-side avoids the strict
// extension/size gates that were silently rejecting real uploads before
// they ever reached the network.
const MAX_DIMENSION_PX = 1024
const JPEG_QUALITY = 0.85

// Thrown when the browser itself can't decode the source file (e.g. HEIC
// on a non-WebKit browser, or a corrupt image) — distinct from a network/
// upload failure, since the fix is "pick a different photo" rather than
// "check your connection and retry".
export class PhotoDecodeError extends Error {}

export async function compressToJpeg(file: File): Promise<Blob> {
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

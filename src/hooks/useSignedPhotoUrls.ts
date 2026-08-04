import { useEffect, useState } from 'react'
import { getSignedProfilePhotoUrls } from '@/services/storageService'

// Resolves a batch of private "members" bucket storage paths into signed
// URLs, keyed by path. Used by list pages (admin members, event
// participants) that render many avatars at once — one signed-URL request
// for the whole page instead of one per row.
export function useSignedPhotoUrls(
  paths: Array<string | null | undefined>,
): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const key = paths.filter(Boolean).join(',')

  useEffect(() => {
    const validPaths = paths.filter((path): path is string => Boolean(path))
    if (validPaths.length === 0) {
      setUrls({})
      return
    }

    let cancelled = false
    void getSignedProfilePhotoUrls(validPaths).then((map) => {
      if (!cancelled) setUrls(map)
    })
    return () => {
      cancelled = true
    }
    // Re-resolve only when the actual set of paths changes, not on every
    // unrelated re-render of the calling list page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return urls
}

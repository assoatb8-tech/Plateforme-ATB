import { useEffect, useRef } from 'react'
import { UpdatePrompt } from '@/pwa/UpdatePrompt'
import { InstallPrompt } from '@/pwa/InstallPrompt'

// A single fixed container stacking both banners — kept separate from
// UpdatePrompt/InstallPrompt themselves so they can never end up
// independently `fixed` at the same screen position and overlap (a real
// possibility: a browser tab left open across a deploy, before the user
// ever installed, can have both needRefresh and canInstall true at once).
export function PwaPrompts() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Being `fixed` keeps the banners from pushing page content around as
  // they mount/unmount, but that also means they can sit on top of
  // whatever's at the bottom of a short page (e.g. an admin dashboard's
  // last stat card). Mirroring the stack's real rendered height onto the
  // page as bottom padding keeps it out of the way without hardcoding a
  // height that would drift the moment either banner's copy changes.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const height = container.offsetHeight
      document.body.style.setProperty('--pwa-prompt-space', height > 0 ? `${height + 16}px` : '0px')
    })
    observer.observe(container)
    return () => {
      observer.disconnect()
      document.body.style.removeProperty('--pwa-prompt-space')
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <UpdatePrompt />
      <InstallPrompt />
    </div>
  )
}

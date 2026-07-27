import { useEffect, useState } from 'react'

// Chrome/Edge/Android fire this instead of showing their own install UI,
// so the app can offer an "Installer l'application" button matching its
// own design instead of relying on the browser's address-bar icon (which
// non-technical users, per DESIGN.md's target audience, are unlikely to
// notice on their own).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'atb.pwa-install-dismissed'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1')

  useEffect(() => {
    function handler(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function promptInstall(): Promise<void> {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function dismiss(): void {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return {
    canInstall: Boolean(deferredPrompt) && !dismissed,
    promptInstall,
    dismiss,
  }
}

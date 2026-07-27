import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Shown when a new service worker has installed and is waiting to take
// over. registerType: 'prompt' (vite.config.ts) means we control this UI
// ourselves instead of silently auto-reloading users mid-task.
export function UpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error: unknown) => {
      // Best-effort feature: a failed SW registration must never break the
      // app itself, so this is deliberately swallowed beyond a dev log.
      console.error('Service worker registration failed', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-surface p-4 shadow-lg">
      <RefreshCw size={20} className="shrink-0 text-primary" />
      <p className="flex-1 text-sm text-slate-700">{t('pwa.updateAvailable')}</p>
      <Button variant="primary" onClick={() => void updateServiceWorker(true)}>
        {t('pwa.updateCta')}
      </Button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label={t('pwa.dismiss')}
        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={18} />
      </button>
    </div>
  )
}

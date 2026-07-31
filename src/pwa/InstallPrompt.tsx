import { useTranslation } from 'react-i18next'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useInstallPrompt } from '@/pwa/useInstallPrompt'

export function InstallPrompt() {
  const { t } = useTranslation()
  const { canInstall, promptInstall, dismiss } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-surface p-4 shadow-lg">
      <Download size={20} className="shrink-0 text-primary" />
      <p className="flex-1 text-sm text-slate-700">{t('pwa.installPrompt')}</p>
      <Button variant="primary" onClick={() => void promptInstall()}>
        {t('pwa.installCta')}
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('pwa.dismiss')}
        className="rounded-full p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={18} />
      </button>
    </div>
  )
}

import { useTranslation } from 'react-i18next'

interface ComingSoonPageProps {
  titleKey: string
}

export function ComingSoonPage({ titleKey }: ComingSoonPageProps) {
  const { t, i18n } = useTranslation()
  const message = i18n.language === 'ar' ? 'هذه الصفحة قادمة قريبًا.' : 'Cette page arrive bientôt.'

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">{t(titleKey)}</h1>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

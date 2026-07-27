import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import type { SupportedLanguage } from '@/translations/i18n'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const nextLanguage: SupportedLanguage = i18n.language === 'fr' ? 'ar' : 'fr'

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(nextLanguage)}
      aria-label={t('language.switch')}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      <Languages size={18} />
      <span>{t(`language.${nextLanguage}`)}</span>
    </button>
  )
}

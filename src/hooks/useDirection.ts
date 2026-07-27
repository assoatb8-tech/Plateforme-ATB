import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { languageDirections, type SupportedLanguage } from '@/translations/i18n'

export function useDirection(): void {
  const { i18n } = useTranslation()

  useEffect(() => {
    const applyDirection = (language: string) => {
      const lang = language as SupportedLanguage
      const direction = languageDirections[lang] ?? 'ltr'
      document.documentElement.lang = lang
      document.documentElement.dir = direction
    }

    applyDirection(i18n.language)
    i18n.on('languageChanged', applyDirection)
    return () => {
      i18n.off('languageChanged', applyDirection)
    }
  }, [i18n])
}

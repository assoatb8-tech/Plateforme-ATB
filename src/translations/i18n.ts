import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonFr from './fr/common.json'
import commonAr from './ar/common.json'

export const supportedLanguages = ['fr', 'ar'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageDirections: Record<SupportedLanguage, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  ar: 'rtl',
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { common: commonFr },
      ar: { common: commonAr },
    },
    fallbackLng: 'fr',
    supportedLngs: supportedLanguages,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n

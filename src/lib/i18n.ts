import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import sr from '@/locales/sr.json'

// Ordered by priority; add new languages here to make them selectable app-wide.
export const supportedLanguages = ['sr', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const defaultLanguage: SupportedLanguage = 'sr'

export function isSupportedLanguage(value: string | undefined): value is SupportedLanguage {
  return !!value && (supportedLanguages as readonly string[]).includes(value)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      sr: { translation: sr },
      en: { translation: en },
    },
    supportedLngs: supportedLanguages,
    fallbackLng: defaultLanguage,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    // URL is the source of truth once the router mounts (see LocaleGate); this
    // detection order only resolves the *initial* language for the "/" redirect.
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import sr from '@/locales/sr.json'

export const defaultLanguage = 'sr'

void i18n.use(initReactI18next).init({
  resources: {
    sr: { translation: sr },
    en: { translation: en },
  },
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n

import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { defaultLanguage, isSupportedLanguage, type SupportedLanguage } from '@/lib/i18n'

// Prefers the :lang route param (source of truth once routed), falling back
// to the active i18n language during the brief window before routing settles.
export function useCurrentLang(): SupportedLanguage {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()

  if (isSupportedLanguage(lang)) return lang
  if (isSupportedLanguage(i18n.language)) return i18n.language
  return defaultLanguage
}

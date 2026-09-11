import type { SupportedLanguage } from '@/lib/i18n'

export function pickLocalized(
  en: string,
  sr: string | null | undefined,
  lang: SupportedLanguage,
): string {
  if (lang === 'sr' && sr) return sr
  return en
}

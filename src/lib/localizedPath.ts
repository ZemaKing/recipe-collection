import type { SupportedLanguage } from '@/lib/i18n'

export function buildLocalizedPath(lang: SupportedLanguage, path: string): string {
  if (path === '/') return `/${lang}`
  return `/${lang}${path}`
}

export function stripLangPrefix(pathname: string): string {
  const rest = pathname.split('/').slice(2).join('/')
  return rest ? `/${rest}` : ''
}

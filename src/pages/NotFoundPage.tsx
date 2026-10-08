import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath } from '@/lib/localizedPath'

// Any unknown path under /:lang (unknown paths without a valid :lang are first redirected
// under one by LocaleGate). Vercel serves every path as index.html with a 200, so the robots
// meta is what tells search engines this is a 404.
function NotFoundPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border p-10 text-center">
      <meta name="robots" content="noindex" />
      <SearchX className="size-8 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{t('notFoundPage.title')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('notFoundPage.description')}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link
          to={buildLocalizedPath(lang, '/')}
          className="rounded-pill bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t('notFoundPage.home')}
        </Link>
        <Link
          to={buildLocalizedPath(lang, '/recepti')}
          className="rounded-pill border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('notFoundPage.allRecipes')}
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage

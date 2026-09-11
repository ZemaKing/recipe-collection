import { ChefHat, Search, SunMedium, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath, stripLangPrefix } from '@/lib/localizedPath'
import { QUERY_PARAM } from '@/lib/recipeSearchParams'
import LanguageSwitcher from './LanguageSwitcher'

function Topbar() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const onRecipesPage = stripLangPrefix(location.pathname) === '/recepti'
  const query = onRecipesPage ? (searchParams.get(QUERY_PARAM) ?? '') : ''

  function handleQueryChange(value: string) {
    if (onRecipesPage) {
      const next = new URLSearchParams(searchParams)
      if (value) next.set(QUERY_PARAM, value)
      else next.delete(QUERY_PARAM)
      setSearchParams(next, { replace: true })
    } else if (value) {
      navigate(`${buildLocalizedPath(lang, '/recepti')}?${QUERY_PARAM}=${encodeURIComponent(value)}`)
    }
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-3 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <ChefHat className="size-6 shrink-0 text-accent" />
        <span className="text-base font-semibold">{t('app.name')}</span>
      </div>

      <div className="hidden flex-col md:flex">
        <h1 className="text-lg font-semibold">{t('topbar.welcome')}</h1>
        <p className="text-sm text-muted-foreground">{t('topbar.subtitle')}</p>
      </div>

      <div className="ml-auto flex items-center justify-end gap-3">
        <label className="relative hidden md:block md:w-72 lg:w-80">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t('topbar.searchPlaceholder')}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            className="w-full rounded-control border border-border bg-surface-elevated py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </label>

        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground md:hidden"
          title={t('topbar.search')}
        >
          <Search className="size-4" />
        </button>

        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
          title={t('topbar.theme')}
        >
          <SunMedium className="size-4" />
        </button>

        <LanguageSwitcher />

        <Link
          to={buildLocalizedPath(lang, session ? '/admin/recepti/novi' : '/prijava')}
          title={session ? t('login.loggedInAs', { email: session.user.email }) : t('login.title')}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground transition-colors hover:text-foreground"
        >
          <User className="size-4" />
        </Link>
      </div>
    </header>
  )
}

export default Topbar

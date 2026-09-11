import { ChefHat, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useTags } from '@/hooks/useTags'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath, stripLangPrefix } from '@/lib/localizedPath'
import { parseTagsParam, toggleTagInParams } from '@/lib/recipeSearchParams'
import { cn } from '@/lib/utils'
import NavRow from './NavRow'
import { categoryNavItems, primaryNavItems } from './nav-items'

function QuickFilters() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { tags } = useTags()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const onRecipesPage = stripLangPrefix(location.pathname) === '/recepti'
  const activeTags = onRecipesPage ? parseTagsParam(searchParams) : []

  if (tags.length === 0) return null

  function handleToggle(tagSlug: string) {
    if (onRecipesPage) {
      const next = toggleTagInParams(searchParams, tagSlug)
      navigate({ pathname: buildLocalizedPath(lang, '/recepti'), search: next.toString() })
    } else {
      navigate(`${buildLocalizedPath(lang, '/recepti')}?tags=${tagSlug}`)
    }
  }

  return (
    <div className="mt-6 hidden lg:block">
      <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('browse.quickFilters')}
      </p>
      <div className="flex flex-col gap-1">
        {tags.map((tag) => {
          const active = activeTags.includes(tag.slug)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggle(tag.slug)}
              className={cn(
                'rounded-control px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground',
                active && 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent',
              )}
            >
              {pickLocalized(tag.name_en, tag.name_sr, lang)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Sidebar() {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  return (
    <aside className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex md:w-20 lg:w-64">
      <div className="flex items-center gap-2 px-4 py-5 lg:px-6">
        <ChefHat className="size-7 shrink-0 text-accent" />
        <span className="hidden text-lg font-semibold lg:inline">{t('app.name')}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {primaryNavItems.map((item) => (
          <NavRow key={item.path} {...item} />
        ))}

        <div className="mt-6 hidden lg:block">
          <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('nav.categories')}
          </p>
          <div className="flex flex-col gap-1">
            {categoryNavItems.map((item) => (
              <NavRow key={item.path} {...item} />
            ))}
          </div>
        </div>

        <QuickFilters />
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to={buildLocalizedPath(lang, '/admin/recepti/novi')}
          className="flex items-center justify-center gap-2 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          title={t('nav.addRecipe')}
          aria-label={t('nav.addRecipe')}
        >
          <Plus className="size-4 shrink-0" />
          <span className="hidden lg:inline">{t('nav.addRecipe')}</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar

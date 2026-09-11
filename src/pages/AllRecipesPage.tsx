import { useMemo } from 'react'
import { SearchX, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import RecipeCard from '@/components/recipes/RecipeCard'
import EmptyState from '@/components/ui/EmptyState'
import { useAllRecipes } from '@/hooks/useAllRecipes'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useTags } from '@/hooks/useTags'
import { pickLocalized } from '@/lib/localizedField'
import { filterAndSortRecipes, type SortOption } from '@/lib/recipeFilter'
import {
  CATEGORY_PARAM,
  FAVORITE_PARAM,
  QUERY_PARAM,
  SORT_PARAM,
  parseSortParam,
  parseTagsParam,
  toggleTagInParams,
} from '@/lib/recipeSearchParams'
import { getTagIcon } from '@/lib/tagIcons'
import { cn } from '@/lib/utils'

function AllRecipesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { session } = useAuth()
  const { recipes, isLoading, toggleFavorite } = useAllRecipes()
  const { categories } = useCategories()
  const { tags } = useTags()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get(QUERY_PARAM) ?? ''
  const categorySlug = searchParams.get(CATEGORY_PARAM)
  const favoritesOnly = searchParams.get(FAVORITE_PARAM) === '1'
  const sort = parseSortParam(searchParams)
  const activeTags = parseTagsParam(searchParams)

  const hasActiveFilters =
    !!query || !!categorySlug || favoritesOnly || activeTags.length > 0 || sort !== 'recent'

  const visibleRecipes = useMemo(
    () =>
      filterAndSortRecipes(recipes, {
        query,
        categorySlug,
        favoritesOnly,
        tagSlugs: activeTags,
        sort,
      }),
    [recipes, query, categorySlug, favoritesOnly, activeTags, sort],
  )

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  function toggleTag(tagSlug: string) {
    setSearchParams(toggleTagInParams(searchParams, tagSlug))
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams())
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {t('allRecipesPage.title')}
        {!isLoading && ` (${recipes.length})`}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={categorySlug ?? ''}
          onChange={(event) => updateParam(CATEGORY_PARAM, event.target.value || null)}
          className="rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
        >
          <option value="">{t('browse.categoryAll')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {pickLocalized(category.name_en, category.name_sr, lang)}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => updateParam(SORT_PARAM, event.target.value as SortOption)}
          className="rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground"
        >
          <option value="recent">{t('browse.sort.recent')}</option>
          <option value="rating">{t('browse.sort.rating')}</option>
          <option value="time">{t('browse.sort.time')}</option>
        </select>

        <button
          type="button"
          onClick={() => updateParam(FAVORITE_PARAM, favoritesOnly ? null : '1')}
          className={`rounded-pill border border-border px-3 py-2 text-sm font-medium transition-colors ${
            favoritesOnly ? 'border-accent bg-accent-soft text-accent' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('browse.favoritesOnly')}
        </button>

        {/* Mobile only: the sidebar's tag list (the only other way to add a
            tag filter) is hidden below lg, so show every tag here since
            there's otherwise no way to add a tag filter on mobile. */}
        <div className="contents md:hidden">
          {tags.map((tag) => {
            const Icon = getTagIcon(tag.slug)
            const active = activeTags.includes(tag.slug)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.slug)}
                className={cn(
                  'flex items-center gap-1.5 rounded-pill border px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-tag bg-tag-soft text-tag'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3.5 text-tag" />
                {pickLocalized(tag.name_en, tag.name_sr, lang)}
                {active && <X className="size-3.5" />}
              </button>
            )
          })}
        </div>

        {/* Desktop/tablet: only show already-active tags as removable chips;
            adding a tag filter is done via the sidebar's quick-filter list. */}
        <div className="hidden md:contents">
          {activeTags.map((tagSlug) => {
            const tag = tags.find((item) => item.slug === tagSlug)
            if (!tag) return null
            const Icon = getTagIcon(tag.slug)
            return (
              <button
                key={tagSlug}
                type="button"
                onClick={() => toggleTag(tagSlug)}
                className="flex items-center gap-1.5 rounded-pill border border-tag bg-tag-soft px-3 py-2 text-sm font-medium text-tag"
              >
                <Icon className="size-3.5" />
                {pickLocalized(tag.name_en, tag.name_sr, lang)}
                <X className="size-3.5" />
              </button>
            )
          })}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {t('browse.clearFilters')}
          </button>
        )}
      </div>

      {!isLoading && visibleRecipes.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={t('browse.noResults.title')}
          description={t('browse.noResults.description')}
        />
      )}

      {visibleRecipes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onToggleFavorite={session ? () => void toggleFavorite(recipe.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AllRecipesPage

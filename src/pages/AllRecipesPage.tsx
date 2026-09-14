import { Fragment, useMemo } from 'react'
import { Heart, SearchX, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import CategoryFilterSelect from '@/components/recipes/CategoryFilterSelect'
import RecipeCard from '@/components/recipes/RecipeCard'
import SortFilterSelect from '@/components/recipes/SortFilterSelect'
import SubcategoryFilterSelect from '@/components/recipes/SubcategoryFilterSelect'
import EmptyState from '@/components/ui/EmptyState'
import { useAllRecipes } from '@/hooks/useAllRecipes'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useSubcategories } from '@/hooks/useSubcategories'
import { useTags } from '@/hooks/useTags'
import { pickLocalized } from '@/lib/localizedField'
import { filterAndSortRecipes } from '@/lib/recipeFilter'
import {
  CATEGORY_PARAM,
  FAVORITE_PARAM,
  QUERY_PARAM,
  SORT_PARAM,
  SUBCATEGORY_PARAM,
  parseSortParam,
  parseTagsParam,
  toggleTagInParams,
} from '@/lib/recipeSearchParams'
import { getTagColors, getTagIcon, PINNED_TAG_SLUG } from '@/lib/tagIcons'
import { cn } from '@/lib/utils'

function AllRecipesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { session } = useAuth()
  const { recipes, isLoading, toggleFavorite } = useAllRecipes()
  const { categories } = useCategories()
  const { subcategories } = useSubcategories()
  const { tags } = useTags()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get(QUERY_PARAM) ?? ''
  const categorySlug = searchParams.get(CATEGORY_PARAM)
  const subcategorySlug = searchParams.get(SUBCATEGORY_PARAM)
  const favoritesOnly = searchParams.get(FAVORITE_PARAM) === '1'
  const sort = parseSortParam(searchParams)
  const activeTags = parseTagsParam(searchParams)

  const hasActiveFilters =
    !!query || !!categorySlug || !!subcategorySlug || favoritesOnly || activeTags.length > 0 || sort !== 'recent'

  const selectedCategory = categories.find((category) => category.slug === categorySlug)
  const availableSubcategories = selectedCategory
    ? subcategories.filter((subcategory) => subcategory.category_id === selectedCategory.id)
    : []

  const visibleRecipes = useMemo(
    () =>
      filterAndSortRecipes(recipes, {
        query,
        categorySlug,
        subcategorySlug,
        favoritesOnly,
        tagSlugs: activeTags,
        sort,
      }),
    [recipes, query, categorySlug, subcategorySlug, favoritesOnly, activeTags, sort],
  )

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  function handleCategoryChange(slug: string | null) {
    const next = new URLSearchParams(searchParams)
    if (slug) next.set(CATEGORY_PARAM, slug)
    else next.delete(CATEGORY_PARAM)
    next.delete(SUBCATEGORY_PARAM)
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
        <CategoryFilterSelect
          categories={categories}
          value={categorySlug}
          onChange={handleCategoryChange}
          lang={lang}
          allLabel={t('browse.categoryAll')}
        />

        {selectedCategory && availableSubcategories.length > 0 && (
          <SubcategoryFilterSelect
            subcategories={availableSubcategories}
            value={subcategorySlug}
            onChange={(slug) => updateParam(SUBCATEGORY_PARAM, slug)}
            lang={lang}
            allLabel={t('browse.subcategoryAll')}
          />
        )}

        <SortFilterSelect
          value={sort}
          onChange={(value) => updateParam(SORT_PARAM, value)}
          labels={{
            recent: t('browse.sort.recent'),
            rating: t('browse.sort.rating'),
            time: t('browse.sort.time'),
          }}
        />

        <button
          type="button"
          onClick={() => updateParam(FAVORITE_PARAM, favoritesOnly ? null : '1')}
          className={`flex items-center gap-1.5 rounded-pill border px-3 py-2 text-sm font-medium transition-colors ${
            favoritesOnly ? 'border-favorite bg-favorite/10 text-favorite' : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Heart className={favoritesOnly ? 'size-4 fill-favorite text-favorite' : 'size-4 text-muted-foreground'} />
          {t('browse.favoritesOnly')}
        </button>

        {/* Mobile only: the sidebar's tag list (the only other way to add a
            tag filter) is hidden below lg, so show every tag here since
            there's otherwise no way to add a tag filter on mobile. */}
        <div className="contents md:hidden">
          {tags.map((tag, index) => {
            const Icon = getTagIcon(tag.slug)
            const colors = getTagColors(tag.slug)
            const active = activeTags.includes(tag.slug)
            const showDividerAfter = tag.slug === PINNED_TAG_SLUG && index < tags.length - 1
            return (
              <Fragment key={tag.id}>
                <button
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-pill border px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? cn(colors.border, colors.bgSoft, colors.text)
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className={cn('size-3.5', colors.text)} />
                  {pickLocalized(tag.name_en, tag.name_sr, lang)}
                  {active && <X className="size-3.5" />}
                </button>
                {/* Visually separate the pinned tag from the shared-green ones. */}
                {showDividerAfter && <span aria-hidden="true" className="h-6 w-px self-center bg-border" />}
              </Fragment>
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
            const colors = getTagColors(tag.slug)
            return (
              <button
                key={tagSlug}
                type="button"
                onClick={() => toggleTag(tagSlug)}
                className={cn(
                  'flex items-center gap-1.5 rounded-pill border px-3 py-2 text-sm font-medium',
                  colors.border,
                  colors.bgSoft,
                  colors.text,
                )}
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

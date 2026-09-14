import { BookOpen, FolderX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import RecipeCard from '@/components/recipes/RecipeCard'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useRecipesByCategory } from '@/hooks/useRecipesByCategory'
import { useSubcategories } from '@/hooks/useSubcategories'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'
import { cn } from '@/lib/utils'

function CategoryRecipesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { session } = useAuth()
  const { slug = '', subcategorySlug } = useParams<{ slug: string; subcategorySlug?: string }>()
  const { category, recipes, isLoading, notFound, toggleFavorite } = useRecipesByCategory(slug, subcategorySlug)
  const { subcategories } = useSubcategories()

  if (!isLoading && notFound) {
    return (
      <EmptyState
        icon={FolderX}
        title={t('categoryDetailPage.notFoundTitle')}
        description={t('categoryDetailPage.notFoundDescription')}
      />
    )
  }

  const categoryName = category ? pickLocalized(category.name_en, category.name_sr, lang) : ''
  const categorySubcategories = category
    ? subcategories.filter((sub) => sub.category_id === category.id && sub.recipeCount > 0)
    : []

  return (
    <div className="flex flex-col gap-4">
      {category && (
        <div>
          <h1 className="text-xl font-semibold">{categoryName}</h1>
          <p className="text-sm text-muted-foreground">
            {t('common.recipeCount', { count: recipes.length })}
          </p>
        </div>
      )}

      {category && categorySubcategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={buildLocalizedPath(lang, `/kategorije/${category.slug}`)}
            className={cn(
              'rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors',
              !subcategorySlug
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {t('browse.subcategoryAll')}
          </Link>
          {categorySubcategories.map((sub) => (
            <Link
              key={sub.id}
              to={buildLocalizedPath(lang, `/kategorije/${category.slug}/${sub.slug}`)}
              className={cn(
                'rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors',
                subcategorySlug === sub.slug
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {pickLocalized(sub.name_en, sub.name_sr, lang)}
            </Link>
          ))}
        </div>
      )}

      {!isLoading && category && recipes.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={t('categoryDetailPage.emptyTitle')}
          description={t('categoryDetailPage.emptyDescription')}
        />
      )}

      {recipes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {recipes.map((recipe) => (
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

export default CategoryRecipesPage

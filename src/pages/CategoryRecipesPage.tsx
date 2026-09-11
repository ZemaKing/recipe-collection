import { BookOpen, FolderX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import RecipeCard from '@/components/recipes/RecipeCard'
import EmptyState from '@/components/ui/EmptyState'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useRecipesByCategory } from '@/hooks/useRecipesByCategory'
import { pickLocalized } from '@/lib/localizedField'

function CategoryRecipesPage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { slug = '' } = useParams<{ slug: string }>()
  const { category, recipes, isLoading, notFound } = useRecipesByCategory(slug)

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
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoryRecipesPage

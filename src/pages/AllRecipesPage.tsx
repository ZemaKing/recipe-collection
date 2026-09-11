import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import RecipeCard from '@/components/recipes/RecipeCard'
import EmptyState from '@/components/ui/EmptyState'
import { useAllRecipes } from '@/hooks/useAllRecipes'

function AllRecipesPage() {
  const { t } = useTranslation()
  const { recipes, isLoading } = useAllRecipes()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {t('allRecipesPage.title')}
        {!isLoading && ` (${recipes.length})`}
      </h1>

      {!isLoading && recipes.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={t('home.empty.title')}
          description={t('home.empty.description')}
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

export default AllRecipesPage

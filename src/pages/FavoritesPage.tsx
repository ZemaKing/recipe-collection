import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import RecipeCard from '@/components/recipes/RecipeCard'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useFavoriteRecipes } from '@/hooks/useFavoriteRecipes'

function FavoritesPage() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { recipes, isLoading, toggleFavorite } = useFavoriteRecipes()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('pages.favorites')}</h1>
        {!isLoading && <p className="text-sm text-muted-foreground">{t('common.recipeCount', { count: recipes.length })}</p>}
      </div>

      {!isLoading && recipes.length === 0 && (
        <EmptyState
          icon={Heart}
          title={t('favoritesPage.emptyTitle')}
          description={t('favoritesPage.emptyDescription')}
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

export default FavoritesPage

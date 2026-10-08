import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import RecipeCard from '@/components/recipes/RecipeCard'
import EmptyState from '@/components/ui/EmptyState'
import { useFavorites } from '@/hooks/useFavorites'
import { useFavoriteRecipes } from '@/hooks/useFavoriteRecipes'

function FavoritesPage() {
  const { t } = useTranslation()
  const favorites = useFavorites()
  const { recipes: favoriteRecipes, isLoading, toggleFavorite } = useFavoriteRecipes(favorites.localIds)
  // Drops a visitor's just-unfavourited card right away, before the refetch.
  const recipes = favoriteRecipes.map(favorites.apply).filter((recipe) => recipe.is_favorite)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t('pages.favorites')}</h1>
        {!isLoading && <p className="text-sm text-muted-foreground">{t('common.recipeCount', { count: recipes.length })}</p>}
        {favorites.localIds !== null && <p className="text-xs text-muted-foreground">{t('favoritesPage.localHint')}</p>}
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
              onToggleFavorite={() => favorites.toggle(recipe.id, () => toggleFavorite(recipe.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage

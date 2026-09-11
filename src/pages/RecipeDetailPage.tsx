import { FileX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import IngredientList from '@/components/recipes/IngredientList'
import RecipeDetailHero from '@/components/recipes/RecipeDetailHero'
import RecipeMeta from '@/components/recipes/RecipeMeta'
import StepList from '@/components/recipes/StepList'
import TipsPanel from '@/components/recipes/TipsPanel'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useRecipeBySlug } from '@/hooks/useRecipeBySlug'

function RecipeDetailPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams<{ slug: string }>()
  const { session } = useAuth()
  const { recipe, isLoading, notFound, toggleFavorite } = useRecipeBySlug(slug)

  if (!isLoading && notFound) {
    return (
      <EmptyState
        icon={FileX}
        title={t('recipeDetail.notFoundTitle')}
        description={t('recipeDetail.notFoundDescription')}
      />
    )
  }

  if (!recipe) return null

  return (
    <div className="flex flex-col gap-6">
      <RecipeDetailHero
        key={recipe.slug}
        recipe={recipe}
        onToggleFavorite={session ? () => void toggleFavorite() : undefined}
      />
      <RecipeMeta recipe={recipe} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="lg:w-[380px] lg:shrink-0">
          <IngredientList ingredients={recipe.ingredients} baseServings={recipe.servings} />
        </div>
        <div className="min-w-0 flex-1">
          <StepList steps={recipe.steps} />
        </div>
      </div>

      <TipsPanel recipe={recipe} />
    </div>
  )
}

export default RecipeDetailPage

import { FileX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import IngredientList from '@/components/recipes/IngredientList'
import NutritionPanel from '@/components/recipes/NutritionPanel'
import RecipeDetailHero from '@/components/recipes/RecipeDetailHero'
import RecipeMeta from '@/components/recipes/RecipeMeta'
import StepList from '@/components/recipes/StepList'
import TipsPanel from '@/components/recipes/TipsPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRecipeBySlug } from '@/hooks/useRecipeBySlug'

function RecipeDetailPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams<{ slug: string }>()
  const { session } = useAuth()
  const { recipe, isLoading, notFound, toggleFavorite } = useRecipeBySlug(slug)
  // Tabs are a mobile/tablet space-saving device; desktop has room to show
  // everything at once, matching the pattern used pre-Phase-1.
  const isDesktop = useMediaQuery('(min-width: 1024px)')

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

  const hasTips = !!recipe.tips_en
  const hasNutrition = recipe.ingredients.some((ingredient) => ingredient.ingredient)

  return (
    <div className="flex flex-col gap-6">
      <RecipeDetailHero
        key={recipe.slug}
        recipe={recipe}
        onToggleFavorite={session ? () => void toggleFavorite() : undefined}
      />
      <RecipeMeta recipe={recipe} />

      {isDesktop ? (
        <>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="lg:w-[380px] lg:shrink-0">
              <IngredientList ingredients={recipe.ingredients} baseServings={recipe.servings} />
            </div>
            <div className="min-w-0 flex-1">
              <StepList steps={recipe.steps} />
            </div>
          </div>

          {hasNutrition && <NutritionPanel recipe={recipe} />}
          {hasTips && <TipsPanel recipe={recipe} />}
        </>
      ) : (
        <Tabs defaultValue="ingredients">
          <TabsList className="sticky top-0 z-10 max-w-full overflow-x-auto bg-background">
            <TabsTrigger value="ingredients" className="whitespace-nowrap">
              {t('recipeDetail.ingredients.title')}
            </TabsTrigger>
            <TabsTrigger value="instructions" className="whitespace-nowrap">
              {t('recipeDetail.steps.title')}
            </TabsTrigger>
            {hasNutrition && (
              <TabsTrigger value="nutrition" className="whitespace-nowrap">
                {t('recipeDetail.nutrition.title')}
              </TabsTrigger>
            )}
            {hasTips && (
              <TabsTrigger value="tips" className="whitespace-nowrap">
                {t('recipeDetail.tips.tips')}
              </TabsTrigger>
            )}
          </TabsList>

          {/* forceMount + CSS hide (not unmount) — IngredientList holds live
              servings/checkbox state that must survive switching tabs. */}
          <TabsContent value="ingredients" forceMount>
            <IngredientList ingredients={recipe.ingredients} baseServings={recipe.servings} />
          </TabsContent>

          <TabsContent value="instructions" forceMount>
            <StepList steps={recipe.steps} />
          </TabsContent>

          {hasNutrition && (
            <TabsContent value="nutrition" forceMount>
              <NutritionPanel recipe={recipe} />
            </TabsContent>
          )}

          {hasTips && (
            <TabsContent value="tips" forceMount>
              <TipsPanel recipe={recipe} />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}

export default RecipeDetailPage

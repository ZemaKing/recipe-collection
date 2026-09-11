import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import EmptyState from '@/components/ui/EmptyState'
import QuickFilterChips, { type QuickFilter } from '@/components/recipes/QuickFilterChips'
import RecipeCard from '@/components/recipes/RecipeCard'
import StatsWidget from '@/components/recipes/StatsWidget'
import { useRecentRecipes } from '@/hooks/useRecentRecipes'
import { useRecipeStats } from '@/hooks/useRecipeStats'

function HomePage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<QuickFilter>('all')
  const { recipes: visibleRecipes, isLoading } = useRecentRecipes(filter)
  const { stats } = useRecipeStats()

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <QuickFilterChips
          active={filter}
          onChange={setFilter}
          totalCount={stats.recipeCount}
          favoriteCount={stats.favoriteCount}
        />

        <div>
          <h2 className="mb-3 text-lg font-semibold">{t('home.recentRecipes')}</h2>

          {!isLoading && visibleRecipes.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title={t('home.empty.title')}
              description={t('home.empty.description')}
            />
          )}

          {visibleRecipes.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {visibleRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="hidden w-72 shrink-0 lg:block">
        <StatsWidget stats={stats} />
      </aside>
    </div>
  )
}

export default HomePage

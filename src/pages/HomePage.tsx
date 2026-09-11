import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import EmptyState from '@/components/ui/EmptyState'
import QuickFilterChips, { type QuickFilter } from '@/components/recipes/QuickFilterChips'
import RecipeCard from '@/components/recipes/RecipeCard'
import StatsWidget from '@/components/recipes/StatsWidget'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { useRecentRecipes } from '@/hooks/useRecentRecipes'
import { useRecipeStats } from '@/hooks/useRecipeStats'
import { buildLocalizedPath } from '@/lib/localizedPath'

function HomePage() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const { session } = useAuth()
  const [filter, setFilter] = useState<QuickFilter>('all')
  const { recipes: visibleRecipes, isLoading, toggleFavorite } = useRecentRecipes(filter)
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('home.recentRecipes')}</h2>
            <Link
              to={buildLocalizedPath(lang, '/recepti')}
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              {t('home.seeAll')}
            </Link>
          </div>

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
                <div key={recipe.id} className="w-40 shrink-0 sm:w-44">
                  <RecipeCard
                    recipe={recipe}
                    onToggleFavorite={session ? () => void toggleFavorite(recipe.id) : undefined}
                  />
                </div>
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

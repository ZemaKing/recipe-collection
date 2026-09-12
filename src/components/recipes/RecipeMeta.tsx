import { Clock, Gauge, Scale, Users } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RecipeDetail } from '@/hooks/useRecipeBySlug'
import { formatDuration } from '@/lib/format'

interface RecipeMetaProps {
  recipe: RecipeDetail
}

function MetaItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 text-left sm:flex-col sm:gap-1 sm:px-4 sm:py-3 sm:text-center">
      <Icon className="size-5 shrink-0 text-accent" />
      <div className="flex flex-col sm:contents">
        <p className="text-sm font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function RecipeMeta({ recipe }: RecipeMetaProps) {
  const { t } = useTranslation()

  const prepTime = formatDuration(recipe.prep_time_minutes)
  const cookTime = formatDuration(recipe.cook_time_minutes)
  const totalTime = formatDuration((recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0) || null)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {prepTime && <MetaItem icon={Clock} label={t('recipeDetail.meta.prepTime')} value={prepTime} />}
      {cookTime && <MetaItem icon={Clock} label={t('recipeDetail.meta.cookTime')} value={cookTime} />}
      {totalTime && <MetaItem icon={Clock} label={t('recipeDetail.meta.totalTime')} value={totalTime} />}
      {recipe.servings && (
        <MetaItem icon={Users} label={t('recipeDetail.meta.servings')} value={String(recipe.servings)} />
      )}
      {recipe.weight_grams && (
        <MetaItem icon={Scale} label={t('recipeDetail.meta.weight')} value={`${recipe.weight_grams}g`} />
      )}
      {recipe.difficulty && (
        <MetaItem
          icon={Gauge}
          label={t('recipeDetail.meta.difficulty')}
          value={t(`recipeDetail.difficulty.${recipe.difficulty}`)}
        />
      )}
    </div>
  )
}

export default RecipeMeta

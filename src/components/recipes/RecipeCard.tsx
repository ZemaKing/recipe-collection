import { Clock, ImageOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { formatDuration } from '@/lib/format'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'
import type { RecipeSummary } from '@/types/recipe'

interface RecipeCardProps {
  recipe: RecipeSummary
}

function RecipeCard({ recipe }: RecipeCardProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const name = pickLocalized(recipe.name_en, recipe.name_sr, lang)
  const categoryName = recipe.category
    ? pickLocalized(recipe.category.name_en, recipe.category.name_sr, lang)
    : null
  const duration = formatDuration(
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0) || null,
  )

  return (
    <Link
      to={buildLocalizedPath(lang, `/recepti/${recipe.slug}`)}
      className="flex w-full flex-col gap-2 rounded-card border border-border bg-surface p-2 transition-colors hover:border-accent/50"
    >
      <div className="flex aspect-square items-center justify-center rounded-[calc(var(--radius-card)-0.5rem)] bg-surface-elevated text-muted-foreground">
        <ImageOff className="size-6" aria-label={t('recipeCard.noImage')} />
      </div>
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {categoryName && <p className="truncate text-xs text-muted-foreground">{categoryName}</p>}
        {duration && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {duration}
          </p>
        )}
      </div>
    </Link>
  )
}

export default RecipeCard

import { Clock, Gauge } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import FavoriteButton from '@/components/recipes/FavoriteButton'
import RecipeImage from '@/components/recipes/RecipeImage'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { getCategoryBadgeColor } from '@/lib/categoryColor'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { getDifficultyColor } from '@/lib/difficultyColor'
import { formatDuration } from '@/lib/format'
import { pickLocalized } from '@/lib/localizedField'
import { buildLocalizedPath } from '@/lib/localizedPath'
import type { RecipeSummary } from '@/types/recipe'

interface RecipeCardProps {
  recipe: RecipeSummary
  onToggleFavorite?: () => void
}

function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  const name = pickLocalized(recipe.name_en, recipe.name_sr, lang)
  const categoryName = recipe.category
    ? pickLocalized(recipe.category.name_en, recipe.category.name_sr, lang)
    : null
  const categoryColors = recipe.category ? getCategoryBadgeColor(recipe.category.slug) : null
  const categoryIconNode = recipe.category
    ? [recipe.category].map((category) => {
        const Icon = getCategoryIcon(category.slug)
        return <Icon key={category.slug} className="size-3" />
      })[0]
    : null
  const subcategoryName = recipe.subcategory
    ? pickLocalized(recipe.subcategory.name_en, recipe.subcategory.name_sr, lang)
    : null
  const difficultyLabel = recipe.difficulty ? t(`recipeDetail.difficulty.${recipe.difficulty}`) : null
  const difficultyColor = recipe.difficulty ? getDifficultyColor(recipe.difficulty) : null
  const duration = formatDuration(
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0) || null,
  )
  const imageAlt = recipe.image
    ? pickLocalized(recipe.image.alt_en ?? name, recipe.image.alt_sr, lang)
    : t('recipeCard.noImage')

  return (
    <Link
      to={buildLocalizedPath(lang, `/recepti/${recipe.slug}`)}
      className="flex w-full flex-col gap-2 rounded-card border border-border bg-surface p-2 transition-colors hover:border-accent/50"
    >
      <div className="relative">
        <RecipeImage
          image={recipe.image}
          alt={imageAlt}
          className="aspect-square w-full rounded-[calc(var(--radius-card)-0.5rem)]"
        />
        <FavoriteButton
          isFavorite={recipe.is_favorite}
          onToggle={onToggleFavorite}
          size="sm"
          className="absolute top-1.5 right-1.5 rounded-full bg-surface/80 p-1.5 backdrop-blur-sm"
        />
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{name}</p>

        <div className="flex min-h-[1.25rem] flex-wrap items-center gap-1">
          {categoryName && categoryColors && (
            <span
              className={`flex max-w-full items-center gap-1 truncate rounded-pill px-2 py-0.5 text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}
            >
              {categoryIconNode}
              <span className="truncate">{categoryName}</span>
            </span>
          )}
          {subcategoryName && (
            <span className="max-w-full truncate rounded-pill bg-surface-elevated px-2 py-0.5 text-xs text-muted-foreground">
              {subcategoryName}
            </span>
          )}
        </div>

        <div className="flex min-h-[1rem] items-center justify-between gap-2 text-xs text-muted-foreground">
          {difficultyLabel ? (
            <span className={`flex min-w-0 items-center gap-1 truncate ${difficultyColor}`}>
              <Gauge className="size-3.5 shrink-0" />
              <span className="truncate">{difficultyLabel}</span>
            </span>
          ) : (
            <span />
          )}
          {duration && (
            <span className="flex shrink-0 items-center gap-1">
              <Clock className="size-3.5" />
              {duration}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default RecipeCard

import { useState } from 'react'
import { Share2, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import FavoriteButton from '@/components/recipes/FavoriteButton'
import ImageGallery from '@/components/recipes/ImageGallery'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeDetail } from '@/hooks/useRecipeBySlug'
import { pickLocalized } from '@/lib/localizedField'

interface RecipeDetailHeroProps {
  recipe: RecipeDetail
  onToggleFavorite?: () => void
}

function RecipeDetailHero({ recipe, onToggleFavorite }: RecipeDetailHeroProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const [shared, setShared] = useState(false)

  const name = pickLocalized(recipe.name_en, recipe.name_sr, lang)
  const description = recipe.description_en
    ? pickLocalized(recipe.description_en, recipe.description_sr, lang)
    : null
  const categoryName = recipe.category
    ? pickLocalized(recipe.category.name_en, recipe.category.name_sr, lang)
    : null
  const imageAlt = recipe.image
    ? pickLocalized(recipe.image.alt_en ?? name, recipe.image.alt_sr, lang)
    : t('recipeCard.noImage')

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url })
      } catch {
        // user cancelled the native share sheet; nothing to do
      }
      return
    }
    await navigator.clipboard.writeText(url)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <ImageGallery image={recipe.image} alt={imageAlt} />

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            {categoryName && (
              <span className="inline-block rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                {categoryName}
              </span>
            )}
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{name}</h1>
          </div>

          <FavoriteButton isFavorite={recipe.is_favorite} onToggle={onToggleFavorite} className="shrink-0" />
        </div>

        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            <Star className="size-4 fill-accent text-accent" />
            {recipe.rating.toFixed(1)}
          </span>

          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Share2 className="size-4" />
            {shared ? t('recipeDetail.shareCopied') : t('recipeDetail.share')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeDetailHero

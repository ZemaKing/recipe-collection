import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeDetail } from '@/hooks/useRecipeBySlug'
import { pickLocalized } from '@/lib/localizedField'

interface TipsPanelProps {
  recipe: RecipeDetail
}

// Always visible (not tabbed) — the mockup's "Saveti" box sits below the
// step list on both desktop and mobile, it isn't hidden behind a tab.
function TipsPanel({ recipe }: TipsPanelProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  if (!recipe.tips_en) return null

  const tips = pickLocalized(recipe.tips_en, recipe.tips_sr, lang)

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{t('recipeDetail.tips.tips')}</h2>
      <p className="text-sm text-muted-foreground">{tips}</p>
    </div>
  )
}

export default TipsPanel

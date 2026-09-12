import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeDetail } from '@/hooks/useRecipeBySlug'
import { pickLocalized } from '@/lib/localizedField'

interface TipsPanelProps {
  recipe: RecipeDetail
}

// Rendered inside the "Tips" tab on the detail page — the page only
// includes that tab when tips_en is present, so this early return is
// mostly a safety net rather than the primary gate.
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

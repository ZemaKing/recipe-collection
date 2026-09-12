import { useMemo, useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeDetail } from '@/hooks/useRecipeBySlug'
import { calculateRecipeNutrition, getPerServingNutrition, getTotalNutritionAtServings } from '@/lib/nutrition'
import { getMicronutrientColorClass, macroIcons } from '@/lib/nutritionIcons'
import { calculatePercentDV, getNutrientLabel } from '@/lib/nutritionReference'
import { formatQuantity } from '@/lib/servings'
import { cn } from '@/lib/utils'

interface NutritionPanelProps {
  recipe: RecipeDetail
}

type ViewMode = 'perServing' | 'total'

function NutritionPanel({ recipe }: NutritionPanelProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  // Independent of the Ingredients section's own servings scaler — this
  // toggle just switches between the recipe's per-serving and full-recipe
  // totals, matching the mockup's own dropdown on this panel.
  const [view, setView] = useState<ViewMode>('perServing')
  const [showAllMicronutrients, setShowAllMicronutrients] = useState(false)

  const { totals, linkedCount, totalCount } = useMemo(
    () =>
      calculateRecipeNutrition(
        recipe.ingredients.map((ingredient) => ({
          quantity: ingredient.quantity,
          unit_en: ingredient.unit_en,
          unit_sr: ingredient.unit_sr,
          ingredient: ingredient.ingredient,
        })),
      ),
    [recipe.ingredients],
  )

  if (linkedCount === 0) return null

  const perServing = getPerServingNutrition(totals, recipe.servings)
  const displayed = view === 'perServing' ? perServing : getTotalNutritionAtServings(perServing, recipe.servings ?? 1)

  const macroEntries: { key: keyof typeof macroIcons; value: number; unit: string; label: string }[] = [
    { key: 'calories', value: displayed.calories_kcal, unit: 'kcal', label: t('recipeDetail.nutrition.calories') },
    { key: 'protein', value: displayed.protein_g, unit: 'g', label: t('recipeDetail.nutrition.protein') },
    { key: 'fat', value: displayed.fat_g, unit: 'g', label: t('recipeDetail.nutrition.fat') },
    { key: 'carbs', value: displayed.carbs_g, unit: 'g', label: t('recipeDetail.nutrition.carbs') },
    { key: 'fiber', value: displayed.fiber_g, unit: 'g', label: t('recipeDetail.nutrition.fiber') },
  ]

  const micronutrientEntries = Object.entries(displayed.micronutrients)

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">{t('recipeDetail.nutrition.title')}</h2>
            <span title={t('recipeDetail.nutrition.disclaimer')}>
              <Info className="size-4 text-muted-foreground" />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('recipeDetail.nutrition.autoCalculated', { linked: linkedCount, total: totalCount })}
          </p>
        </div>

        <select
          value={view}
          onChange={(event) => setView(event.target.value as ViewMode)}
          className="rounded-control border border-border bg-surface-elevated px-3 py-1.5 text-sm text-foreground"
        >
          <option value="perServing">{t('recipeDetail.nutrition.perServing')}</option>
          <option value="total">{t('recipeDetail.nutrition.totalRecipe')}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {macroEntries.map((entry) => {
          const { icon: Icon, colorClass, bgClass } = macroIcons[entry.key]
          return (
            <div
              key={entry.key}
              className="flex items-center gap-3 rounded-card border border-border bg-surface-elevated px-3 py-2.5 text-left sm:flex-col sm:items-center sm:gap-1.5 sm:py-3 sm:text-center"
            >
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', bgClass)}>
                <Icon className={cn('size-4', colorClass)} />
              </span>
              <div className="flex flex-col sm:contents">
                <p className="text-base font-semibold text-foreground">
                  {formatQuantity(entry.value)}
                  {entry.unit === 'kcal' ? ` ${entry.unit}` : entry.unit}
                </p>
                <p className="text-xs text-muted-foreground">{entry.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {micronutrientEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowAllMicronutrients((prev) => !prev)}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground lg:pointer-events-none"
          >
            <ChevronDown
              className={cn('size-4 transition-transform lg:hidden', showAllMicronutrients && 'rotate-180')}
            />
            <span className="lg:hidden">
              {t('recipeDetail.nutrition.vitaminsMineralsCount', { count: micronutrientEntries.length })}
            </span>
            <span className="hidden lg:inline">{t('recipeDetail.nutrition.vitaminsMinerals')}</span>
          </button>

          <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-5', !showAllMicronutrients && 'hidden lg:grid')}>
            {micronutrientEntries.map(([key, value]) => {
              const percent = calculatePercentDV(key, value.amount)
              const label = getNutrientLabel(key, lang)
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-card border border-border bg-surface-elevated px-3 py-2.5 sm:flex-col sm:items-start sm:gap-1"
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      getMicronutrientColorClass(key),
                    )}
                  >
                    {label.charAt(0)}
                  </span>
                  <div className="flex flex-col sm:contents">
                    <p className="text-sm font-semibold text-foreground">
                      {formatQuantity(value.amount)}
                      {value.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {percent !== null && (
                      <p className="text-xs text-muted-foreground">
                        {t('recipeDetail.nutrition.dailyValue', { percent })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {t('recipeDetail.nutrition.disclaimer')}
      </p>
    </div>
  )
}

export default NutritionPanel

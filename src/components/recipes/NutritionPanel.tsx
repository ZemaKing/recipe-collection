import { useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, Info, Utensils } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeDetail } from '@/hooks/useRecipeBySlug'
import { calculateRecipeNutrition, getPerServingNutrition, getTotalNutritionAtServings } from '@/lib/nutrition'
import { getMicronutrientColors, macroIcons } from '@/lib/nutritionIcons'
import {
  calculateMacroPercentDV,
  calculatePercentDV,
  DAILY_VALUES,
  getNutrientCode,
  getNutrientLabel,
  MACRO_DAILY_VALUES,
} from '@/lib/nutritionReference'
import { formatQuantity } from '@/lib/servings'
import { cn } from '@/lib/utils'

interface NutritionPanelProps {
  recipe: RecipeDetail
}

type ViewMode = 'perServing' | 'total'

const KEY_MICRONUTRIENT_LIMIT = 4

function Meter({ percent, barClass, trackClass }: { percent: number; barClass: string; trackClass: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full', trackClass)}>
      <div
        className={cn('h-full rounded-full transition-[width]', barClass)}
        style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
      />
    </div>
  )
}

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
  const visibleMicronutrients = showAllMicronutrients
    ? micronutrientEntries
    : micronutrientEntries.slice(0, KEY_MICRONUTRIENT_LIMIT)
  const hasMoreMicronutrients = micronutrientEntries.length > KEY_MICRONUTRIENT_LIMIT

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

        <div className="relative">
          <Utensils className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-accent" />
          <select
            value={view}
            onChange={(event) => setView(event.target.value as ViewMode)}
            className="appearance-none rounded-full border border-border bg-surface-elevated py-1.5 pr-8 pl-8 text-sm font-medium text-foreground"
          >
            <option value="perServing">{t('recipeDetail.nutrition.perServing')}</option>
            <option value="total">{t('recipeDetail.nutrition.totalRecipe')}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
        {macroEntries.map((entry) => {
          const { icon: Icon, colorClass, badgeBgClass, barClass, trackClass } = macroIcons[entry.key]
          const percent = calculateMacroPercentDV(entry.key, entry.value)
          const target = MACRO_DAILY_VALUES[entry.key]
          return (
            <div key={entry.key} className="flex flex-col gap-3 rounded-card border border-border bg-surface-elevated p-3">
              <div className="flex items-center gap-2.5">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-2xl', badgeBgClass)}>
                  <Icon className={cn('size-4', colorClass)} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{entry.label}</p>
                  <p className="text-base font-semibold text-foreground">
                    {formatQuantity(entry.value)} {entry.unit}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Meter percent={percent} barClass={barClass} trackClass={trackClass} />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{percent}%</span>
                  <span className="text-muted-foreground">
                    {t('recipeDetail.nutrition.macroDailyValue', { target: target.toLocaleString(), unit: entry.unit })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {micronutrientEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('recipeDetail.nutrition.vitaminsMinerals')}</h3>
              <p className="text-sm text-muted-foreground">{t('recipeDetail.nutrition.vitaminsMineralsSubtitle')}</p>
            </div>
            {hasMoreMicronutrients && (
              <button
                type="button"
                onClick={() => setShowAllMicronutrients((prev) => !prev)}
                className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
              >
                {showAllMicronutrients
                  ? t('recipeDetail.nutrition.showFewerNutrients')
                  : t('recipeDetail.nutrition.seeAllNutrients')}
                <ArrowRight className={cn('size-3.5 transition-transform', showAllMicronutrients && 'rotate-180')} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleMicronutrients.map(([key, value]) => {
              const percent = calculatePercentDV(key, value.amount)
              const label = getNutrientLabel(key, lang)
              const code = getNutrientCode(key, label)
              const dailyValueRef = DAILY_VALUES[key]
              const { colorClass, badgeBgClass, barClass, trackClass, pillClass } = getMicronutrientColors(key)
              return (
                <div key={key} className="flex flex-col gap-3 rounded-card border border-border bg-surface-elevated p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-xl font-semibold',
                          code.length > 1 ? 'text-[10px]' : 'text-sm',
                          colorClass,
                          badgeBgClass,
                        )}
                      >
                        {code}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">{label}</span>
                    </div>
                    {percent !== null && (
                      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', pillClass)}>
                        {t('recipeDetail.nutrition.dailyValue', { percent })}
                      </span>
                    )}
                  </div>

                  <p className="text-lg font-semibold text-foreground">
                    {formatQuantity(value.amount)} {value.unit}
                  </p>

                  {dailyValueRef && (
                    <div className="flex flex-col gap-1">
                      <Meter percent={percent ?? 0} barClass={barClass} trackClass={trackClass} />
                      <p className="text-xs text-muted-foreground">
                        {t('recipeDetail.nutrition.dailyValueAmount', {
                          amount: formatQuantity(dailyValueRef.amount),
                          unit: dailyValueRef.unit,
                        })}
                      </p>
                    </div>
                  )}
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

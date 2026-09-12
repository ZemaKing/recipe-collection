import { scaleQuantity } from '@/lib/servings'
import type { IngredientNutritionRef, MicronutrientAmount } from '@/types/ingredient'

export interface RecipeIngredientForNutrition {
  quantity: number | null
  unit_en: string | null
  unit_sr: string | null
  ingredient: IngredientNutritionRef | null
}

export interface NutritionTotals {
  calories_kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number
  micronutrients: Record<string, MicronutrientAmount>
}

export interface NutritionResult {
  totals: NutritionTotals
  linkedCount: number
  totalCount: number
}

const ZERO_TOTALS: NutritionTotals = {
  calories_kcal: 0,
  protein_g: 0,
  fat_g: 0,
  carbs_g: 0,
  fiber_g: 0,
  micronutrients: {},
}

const GRAM_UNITS = new Set(['g', 'gram', 'grams', 'grama', 'gr'])
const KILOGRAM_UNITS = new Set(['kg', 'kilogram', 'kilograms'])

// Resolves a recipe_ingredients row's quantity+unit to grams, using the
// linked ingredient's unit_conversions when the unit isn't already a weight
// unit. Returns null (rather than guessing) when no conversion is known.
function resolveGrams(
  quantity: number,
  unitEn: string | null,
  unitSr: string | null,
  unitConversions: Record<string, number>,
): number | null {
  const unitEnLower = unitEn?.trim().toLowerCase() ?? ''
  const unitSrLower = unitSr?.trim().toLowerCase() ?? ''

  if (GRAM_UNITS.has(unitEnLower) || GRAM_UNITS.has(unitSrLower)) return quantity
  if (KILOGRAM_UNITS.has(unitEnLower) || KILOGRAM_UNITS.has(unitSrLower)) return quantity * 1000

  const conversion =
    (unitEn && unitConversions[unitEn]) ??
    (unitSr && unitConversions[unitSr]) ??
    (unitEnLower && unitConversions[unitEnLower]) ??
    (unitSrLower && unitConversions[unitSrLower])

  return typeof conversion === 'number' ? quantity * conversion : null
}

// Sums grams-weighted nutrition across every catalog-linked ingredient row
// whose unit can be resolved to grams. Ingredients with no catalog link, no
// quantity, or an unresolvable unit are skipped (not guessed) and don't
// count toward linkedCount.
export function calculateRecipeNutrition(rows: RecipeIngredientForNutrition[]): NutritionResult {
  const totals: NutritionTotals = { ...ZERO_TOTALS, micronutrients: {} }
  let linkedCount = 0

  for (const row of rows) {
    if (!row.ingredient || row.quantity == null) continue
    const grams = resolveGrams(row.quantity, row.unit_en, row.unit_sr, row.ingredient.unit_conversions)
    if (grams == null) continue

    const factor = grams / 100
    linkedCount += 1

    totals.calories_kcal += (row.ingredient.calories_kcal ?? 0) * factor
    totals.protein_g += (row.ingredient.protein_g ?? 0) * factor
    totals.fat_g += (row.ingredient.fat_g ?? 0) * factor
    totals.carbs_g += (row.ingredient.carbs_g ?? 0) * factor
    totals.fiber_g += (row.ingredient.fiber_g ?? 0) * factor

    for (const [key, value] of Object.entries(row.ingredient.micronutrients)) {
      const existing = totals.micronutrients[key]
      totals.micronutrients[key] = { amount: (existing?.amount ?? 0) + value.amount * factor, unit: value.unit }
    }
  }

  return { totals, linkedCount, totalCount: rows.length }
}

function scaleTotals(totals: NutritionTotals, fromServings: number, toServings: number): NutritionTotals {
  return {
    calories_kcal: scaleQuantity(totals.calories_kcal, fromServings, toServings),
    protein_g: scaleQuantity(totals.protein_g, fromServings, toServings),
    fat_g: scaleQuantity(totals.fat_g, fromServings, toServings),
    carbs_g: scaleQuantity(totals.carbs_g, fromServings, toServings),
    fiber_g: scaleQuantity(totals.fiber_g, fromServings, toServings),
    micronutrients: Object.fromEntries(
      Object.entries(totals.micronutrients).map(([key, value]) => [
        key,
        { amount: scaleQuantity(value.amount, fromServings, toServings), unit: value.unit },
      ]),
    ),
  }
}

// Per-serving nutrition is intrinsic to the recipe as written — it doesn't
// change when the servings scaler is adjusted, only the "total recipe" view
// (derived from this) does.
export function getPerServingNutrition(totals: NutritionTotals, baseServings: number | null): NutritionTotals {
  return scaleTotals(totals, baseServings && baseServings > 0 ? baseServings : 1, 1)
}

export function getTotalNutritionAtServings(perServing: NutritionTotals, servings: number): NutritionTotals {
  return scaleTotals(perServing, 1, servings)
}

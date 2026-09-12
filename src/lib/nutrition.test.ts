import { describe, expect, it } from 'vitest'
import {
  calculateRecipeNutrition,
  getPerServingNutrition,
  getTotalNutritionAtServings,
  type RecipeIngredientForNutrition,
} from './nutrition'
import type { IngredientNutritionRef } from '@/types/ingredient'

function ingredient(overrides: Partial<IngredientNutritionRef>): IngredientNutritionRef {
  return {
    calories_kcal: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    fiber_g: 0,
    micronutrients: {},
    unit_conversions: {},
    ...overrides,
  }
}

describe('calculateRecipeNutrition', () => {
  it('sums grams-weighted nutrition for gram-based quantities', () => {
    const rows: RecipeIngredientForNutrition[] = [
      {
        quantity: 200,
        unit_en: 'g',
        unit_sr: 'g',
        ingredient: ingredient({ calories_kcal: 50, protein_g: 10 }),
      },
    ]
    const { totals, linkedCount, totalCount } = calculateRecipeNutrition(rows)
    expect(totals.calories_kcal).toBeCloseTo(100)
    expect(totals.protein_g).toBeCloseTo(20)
    expect(linkedCount).toBe(1)
    expect(totalCount).toBe(1)
  })

  it('resolves non-gram units via the ingredient unit_conversions map', () => {
    const rows: RecipeIngredientForNutrition[] = [
      {
        quantity: 2,
        unit_en: 'tbsp',
        unit_sr: null,
        ingredient: ingredient({ calories_kcal: 884, unit_conversions: { tbsp: 14 } }),
      },
    ]
    const { totals } = calculateRecipeNutrition(rows)
    // 2 tbsp * 14g = 28g -> 884 kcal/100g * 0.28 = 247.52
    expect(totals.calories_kcal).toBeCloseTo(247.52)
  })

  it('skips ingredients with no catalog link, no quantity, or an unresolvable unit', () => {
    const rows: RecipeIngredientForNutrition[] = [
      { quantity: 100, unit_en: 'g', unit_sr: 'g', ingredient: null },
      { quantity: null, unit_en: 'g', unit_sr: 'g', ingredient: ingredient({ calories_kcal: 100 }) },
      { quantity: 1, unit_en: 'pinch', unit_sr: null, ingredient: ingredient({ calories_kcal: 100 }) },
    ]
    const { totals, linkedCount, totalCount } = calculateRecipeNutrition(rows)
    expect(totals.calories_kcal).toBe(0)
    expect(linkedCount).toBe(0)
    expect(totalCount).toBe(3)
  })

  it('sums micronutrients across ingredients', () => {
    const rows: RecipeIngredientForNutrition[] = [
      {
        quantity: 100,
        unit_en: 'g',
        unit_sr: 'g',
        ingredient: ingredient({ micronutrients: { vitamin_c: { amount: 10, unit: 'mg' } } }),
      },
      {
        quantity: 200,
        unit_en: 'g',
        unit_sr: 'g',
        ingredient: ingredient({ micronutrients: { vitamin_c: { amount: 10, unit: 'mg' } } }),
      },
    ]
    const { totals } = calculateRecipeNutrition(rows)
    // 100g contributes 10mg, 200g contributes 20mg -> 30mg total
    expect(totals.micronutrients.vitamin_c.amount).toBeCloseTo(30)
  })
})

describe('getPerServingNutrition / getTotalNutritionAtServings', () => {
  const totals = {
    calories_kcal: 800,
    protein_g: 40,
    fat_g: 20,
    carbs_g: 100,
    fiber_g: 10,
    micronutrients: { vitamin_c: { amount: 40, unit: 'mg' } },
  }

  it('divides totals by the base servings for a per-serving value', () => {
    const perServing = getPerServingNutrition(totals, 4)
    expect(perServing.calories_kcal).toBeCloseTo(200)
    expect(perServing.micronutrients.vitamin_c.amount).toBeCloseTo(10)
  })

  it('treats a missing/zero base servings as 1', () => {
    const perServing = getPerServingNutrition(totals, null)
    expect(perServing.calories_kcal).toBeCloseTo(800)
  })

  it('multiplies per-serving values back up for a target serving count', () => {
    const perServing = getPerServingNutrition(totals, 4)
    const forSixServings = getTotalNutritionAtServings(perServing, 6)
    expect(forSixServings.calories_kcal).toBeCloseTo(1200)
  })
})

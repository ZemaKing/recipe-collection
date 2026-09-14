import { describe, expect, it } from 'vitest'
import type { IngredientCategory, Mineral, Vitamin } from '@/types/ingredient'
import { ingredientImportSchema, resolveIngredientImport, type IngredientImportValues } from './ingredientImport'

const categories: IngredientCategory[] = [
  { id: 'cat-dairy', slug: 'mleko-i-mlecni-proizvodi', name_en: 'Dairy & Milk Products', name_sr: 'Mleko i mlečni proizvodi' },
  { id: 'cat-veg', slug: 'povrce', name_en: 'Vegetables', name_sr: 'Povrće' },
]

const vitamins: Vitamin[] = [
  { id: 'vit-b12', code: 'B12', name_en: 'Vitamin B12', name_sr: 'Vitamin B12', unit: 'µg' },
  { id: 'vit-d', code: 'D', name_en: 'Vitamin D', name_sr: 'Vitamin D', unit: 'µg' },
]

const minerals: Mineral[] = [
  { id: 'min-ca', code: 'Ca', name_en: 'Calcium', name_sr: 'Kalcijum', unit: 'mg' },
  { id: 'min-k', code: 'K', name_en: 'Potassium', name_sr: 'Kalijum', unit: 'mg' },
]

function validImportInput(overrides: Partial<IngredientImportValues> = {}): unknown {
  return {
    name_sr: 'Mleko',
    name_en: 'Milk',
    category: 'mleko-i-mlecni-proizvodi',
    calories_kcal: 62,
    protein_g: 3.4,
    fat_g: 3.6,
    carbs_g: 4.8,
    fiber_g: 0,
    vitamins: [{ vitamin: 'D', amount: 0.1 }],
    minerals: [{ mineral: 'Ca', amount: 120 }],
    unit_conversions: [{ unit: 'čaša', grams: 250 }],
    ...overrides,
  }
}

function resolve(overrides: Partial<IngredientImportValues> = {}) {
  const parsed = ingredientImportSchema.parse(validImportInput(overrides))
  return resolveIngredientImport(parsed, { categories, vitamins, minerals })
}

describe('ingredientImportSchema', () => {
  it('accepts a fully valid import payload', () => {
    const result = ingredientImportSchema.safeParse(validImportInput())
    expect(result.success).toBe(true)
  })

  it('requires name_en', () => {
    const result = ingredientImportSchema.safeParse(validImportInput({ name_en: '' }))
    expect(result.success).toBe(false)
  })

  it('accepts a minimal payload with only name_en', () => {
    const result = ingredientImportSchema.safeParse({ name_en: 'Milk' })
    expect(result.success).toBe(true)
  })

  it('accepts numeric fields as either numbers or numeric strings', () => {
    const result = ingredientImportSchema.safeParse(validImportInput({ calories_kcal: '62' }))
    expect(result.success).toBe(true)
  })
})

describe('resolveIngredientImport', () => {
  it('resolves category by slug', () => {
    const { formState, warnings } = resolve()
    expect(formState.ingredient_category_id).toBe('cat-dairy')
    expect(warnings).toEqual([])
  })

  it('resolves category by localized name when slug does not match', () => {
    const { formState } = resolve({ category: 'Povrće' })
    expect(formState.ingredient_category_id).toBe('cat-veg')
  })

  it('warns but still resolves when the category does not match', () => {
    const { formState, warnings } = resolve({ category: 'nepostojeca-kategorija' })
    expect(formState.ingredient_category_id).toBe('')
    expect(warnings).toEqual([{ key: 'admin.ingredients.importCategoryNotFound', value: 'nepostojeca-kategorija' }])
  })

  it('leaves the category empty (no warning) when omitted', () => {
    const { formState, warnings } = resolve({ category: undefined })
    expect(formState.ingredient_category_id).toBe('')
    expect(warnings).toEqual([])
  })

  it('matches vitamins and minerals by code', () => {
    const { formState } = resolve()
    expect(formState.vitamins).toEqual([{ vitamin_id: 'vit-d', amount: '0.1' }])
    expect(formState.minerals).toEqual([{ mineral_id: 'min-ca', amount: '120' }])
  })

  it('warns and drops unmatched vitamins/minerals', () => {
    const { formState, warnings } = resolve({
      vitamins: [{ vitamin: 'nepostojeci-vitamin', amount: 1 }],
      minerals: [{ mineral: 'nepostojeci-mineral', amount: 1 }],
    })
    expect(formState.vitamins).toEqual([])
    expect(formState.minerals).toEqual([])
    expect(warnings).toEqual([
      { key: 'admin.ingredients.importVitaminNotFound', value: 'nepostojeci-vitamin' },
      { key: 'admin.ingredients.importMineralNotFound', value: 'nepostojeci-mineral' },
    ])
  })

  it('builds unit conversion rows from the unit_conversions array', () => {
    const { formState } = resolve()
    expect(formState.unitConversions).toEqual([{ unit: 'čaša', grams: '250' }])
  })

  it('converts numeric fields to strings for the form state', () => {
    const { formState } = resolve({ calories_kcal: 62, protein_g: '3.4' })
    expect(formState.calories_kcal).toBe('62')
    expect(formState.protein_g).toBe('3.4')
  })

  it('slugifies the name when no slug is provided', () => {
    const { formState } = resolve({ name_en: 'Milk', slug: undefined })
    expect(formState.slug).toBe('milk')
  })
})

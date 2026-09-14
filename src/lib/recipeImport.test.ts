import { describe, expect, it } from 'vitest'
import type { CategoryWithCount } from '@/hooks/useCategories'
import type { IngredientWithCategory } from '@/hooks/useIngredients'
import type { SubcategoryWithCount } from '@/hooks/useSubcategories'
import type { Tag } from '@/hooks/useTags'
import { RecipeImportError, recipeImportSchema, resolveRecipeImport, type RecipeImportValues } from './recipeImport'

const categories: CategoryWithCount[] = [
  { id: 'cat-soups', slug: 'supe-i-corbe', name_en: 'Soups', name_sr: 'Supe i čorbe', recipeCount: 0 },
  { id: 'cat-bakes', slug: 'peciva-i-testo', name_en: 'Baked Goods', name_sr: 'Pecivo i testo', recipeCount: 0 },
]

const subcategories: SubcategoryWithCount[] = [
  { id: 'sub-clear', category_id: 'cat-soups', slug: 'bistre-supe', name_en: 'Clear soups', name_sr: 'Bistre supe', recipeCount: 0 },
  { id: 'sub-salty', category_id: 'cat-bakes', slug: 'slani-kolaci', name_en: 'Savory bakes', name_sr: 'Slani kolači', recipeCount: 0 },
]

const tags: Tag[] = [
  { id: 'tag-quick', slug: 'brzi-recepti', name_en: 'Quick Recipes', name_sr: 'Brzi recepti' },
  { id: 'tag-beginner', slug: 'za-pocetnike', name_en: 'For Beginners', name_sr: 'Za početnike' },
]

const ingredients: IngredientWithCategory[] = [
  {
    id: 'ing-cornmeal',
    slug: 'kukuruzno-brasno',
    ingredient_category_id: null,
    name_en: 'Cornmeal',
    name_sr: 'Kukuruzno brašno',
    latin_name: null,
    regional_names: null,
    fact_en: null,
    fact_sr: null,
    default_unit_en: 'g',
    default_unit_sr: 'g',
    calories_kcal: null,
    protein_g: null,
    fat_g: null,
    carbs_g: null,
    fiber_g: null,
    micronutrients: {},
    unit_conversions: {},
    image_storage_path: null,
    image_alt_en: null,
    image_alt_sr: null,
    ingredient_category: null,
  },
]

function validImportInput(overrides: Partial<RecipeImportValues> = {}): unknown {
  return {
    name_sr: 'Proja sa sirom',
    name_en: 'Cheese Cornbread',
    category: 'peciva-i-testo',
    subcategory: 'slani-kolaci',
    tags: ['brzi-recepti'],
    prep_time_minutes: 15,
    cook_time_minutes: 35,
    servings: 6,
    difficulty: 'easy',
    ingredients: [{ name_sr: 'Kukuruzno brašno', name_en: 'Cornmeal', quantity: 300, unit_sr: 'g', unit_en: 'g' }],
    steps: [{ text_sr: 'Zagrejati rernu na 200°C.', text_en: 'Preheat the oven to 200°C.' }],
    ...overrides,
  }
}

function resolve(overrides: Partial<RecipeImportValues> = {}) {
  const parsed = recipeImportSchema.parse(validImportInput(overrides))
  return resolveRecipeImport(parsed, { categories, subcategories, tags, ingredients })
}

describe('recipeImportSchema', () => {
  it('accepts a fully valid import payload', () => {
    const result = recipeImportSchema.safeParse(validImportInput())
    expect(result.success).toBe(true)
  })

  it('requires name_en', () => {
    const result = recipeImportSchema.safeParse(validImportInput({ name_en: '' }))
    expect(result.success).toBe(false)
  })

  it('requires at least one ingredient', () => {
    const result = recipeImportSchema.safeParse(validImportInput({ ingredients: [] }))
    expect(result.success).toBe(false)
  })

  it('requires at least one step', () => {
    const result = recipeImportSchema.safeParse(validImportInput({ steps: [] }))
    expect(result.success).toBe(false)
  })

  it('accepts numeric fields as either numbers or numeric strings', () => {
    const result = recipeImportSchema.safeParse(validImportInput({ prep_time_minutes: '15' }))
    expect(result.success).toBe(true)
  })
})

describe('resolveRecipeImport', () => {
  it('resolves category, subcategory and tags by slug', () => {
    const { formState, warnings } = resolve()
    expect(formState.category_id).toBe('cat-bakes')
    expect(formState.subcategory_id).toBe('sub-salty')
    expect(formState.tagIds).toEqual(['tag-quick'])
    expect(warnings).toEqual([])
  })

  it('resolves category by localized name when slug does not match', () => {
    const { formState } = resolve({ category: 'Pecivo i testo' })
    expect(formState.category_id).toBe('cat-bakes')
  })

  it('throws RecipeImportError when the category cannot be matched', () => {
    expect(() => resolve({ category: 'nepostojeca-kategorija' })).toThrow(RecipeImportError)
  })

  it('warns but still resolves when a subcategory does not match', () => {
    const { formState, warnings } = resolve({ subcategory: 'nepostojeca-podkategorija' })
    expect(formState.subcategory_id).toBe('')
    expect(warnings).toEqual([{ key: 'admin.recipeForm.importSubcategoryNotFound', value: 'nepostojeca-podkategorija' }])
  })

  it('warns but still resolves when a tag does not match', () => {
    const { formState, warnings } = resolve({ tags: ['nepostojeci-tag'] })
    expect(formState.tagIds).toEqual([])
    expect(warnings).toEqual([{ key: 'admin.recipeForm.importTagNotFound', value: 'nepostojeci-tag' }])
  })

  it('matches ingredients against the catalog by name and fills in the default unit', () => {
    const { formState } = resolve({
      ingredients: [{ name_en: 'Cornmeal', name_sr: undefined, quantity: 300, unit_sr: undefined, unit_en: undefined }],
    })
    expect(formState.ingredients[0]).toEqual({
      name_en: 'Cornmeal',
      name_sr: 'Kukuruzno brašno',
      quantity: '300',
      unit_en: 'g',
      unit_sr: 'g',
      ingredient_id: 'ing-cornmeal',
    })
  })

  it('keeps free-text ingredients with no catalog match', () => {
    const { formState } = resolve({
      ingredients: [{ name_en: 'Unlisted Herb', name_sr: undefined, quantity: 1, unit_en: 'tsp', unit_sr: undefined }],
    })
    expect(formState.ingredients[0]).toEqual({
      name_en: 'Unlisted Herb',
      name_sr: '',
      quantity: '1',
      unit_en: 'tsp',
      unit_sr: '',
      ingredient_id: '',
    })
  })

  it('converts numeric fields to strings for the form state', () => {
    const { formState } = resolve({ prep_time_minutes: 15, cook_time_minutes: '35', servings: 6, weight_grams: 900 })
    expect(formState.prep_time_minutes).toBe('15')
    expect(formState.cook_time_minutes).toBe('35')
    expect(formState.servings).toBe('6')
    expect(formState.weight_grams).toBe('900')
  })

  it('slugifies the name when no slug is provided', () => {
    const { formState } = resolve({ name_en: 'Cheese Cornbread', slug: undefined })
    expect(formState.slug).toBe('cheese-cornbread')
  })
})

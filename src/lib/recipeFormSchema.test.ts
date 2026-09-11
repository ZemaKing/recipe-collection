import { describe, expect, it } from 'vitest'
import { recipeFormSchema, type RecipeFormInput } from './recipeFormSchema'

function validInput(overrides: Partial<RecipeFormInput> = {}): RecipeFormInput {
  return {
    slug: 'test-recipe',
    name_en: 'Test Recipe',
    name_sr: 'Test Recept',
    description_en: '',
    description_sr: '',
    tips_en: '',
    tips_sr: '',
    category_id: 'cat-1',
    prep_time_minutes: '10',
    cook_time_minutes: '20',
    servings: '4',
    weight_grams: '500',
    difficulty: 'easy',
    rating: '4.5',
    tagIds: [],
    ingredients: [{ name_en: 'Flour', name_sr: '', quantity: '200', unit_en: 'g', unit_sr: '' }],
    steps: [{ text_en: 'Mix everything.', text_sr: '' }],
    ...overrides,
  }
}

describe('recipeFormSchema', () => {
  it('accepts a fully valid recipe', () => {
    const result = recipeFormSchema.safeParse(validInput())
    expect(result.success).toBe(true)
  })

  it('requires name_en', () => {
    const result = recipeFormSchema.safeParse(validInput({ name_en: '' }))
    expect(result.success).toBe(false)
  })

  it('allows name_sr to be omitted', () => {
    const result = recipeFormSchema.safeParse(validInput({ name_sr: '' }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name_sr).toBeUndefined()
  })

  it('requires a category', () => {
    const result = recipeFormSchema.safeParse(validInput({ category_id: '' }))
    expect(result.success).toBe(false)
  })

  it('rejects an invalid slug (uppercase/spaces)', () => {
    const result = recipeFormSchema.safeParse(validInput({ slug: 'Test Recipe!' }))
    expect(result.success).toBe(false)
  })

  it('accepts a valid hyphenated slug', () => {
    const result = recipeFormSchema.safeParse(validInput({ slug: 'test-recipe-123' }))
    expect(result.success).toBe(true)
  })

  it('requires at least one ingredient', () => {
    const result = recipeFormSchema.safeParse(validInput({ ingredients: [] }))
    expect(result.success).toBe(false)
  })

  it('requires each ingredient to have a name_en', () => {
    const result = recipeFormSchema.safeParse(
      validInput({ ingredients: [{ name_en: '', name_sr: '', quantity: '', unit_en: '', unit_sr: '' }] }),
    )
    expect(result.success).toBe(false)
  })

  it('requires at least one step', () => {
    const result = recipeFormSchema.safeParse(validInput({ steps: [] }))
    expect(result.success).toBe(false)
  })

  it('requires each step to have text_en', () => {
    const result = recipeFormSchema.safeParse(validInput({ steps: [{ text_en: '', text_sr: '' }] }))
    expect(result.success).toBe(false)
  })

  it('coerces numeric string fields to numbers', () => {
    const result = recipeFormSchema.safeParse(validInput())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.prep_time_minutes).toBe(10)
      expect(result.data.servings).toBe(4)
      expect(result.data.rating).toBe(4.5)
      expect(result.data.ingredients[0].quantity).toBe(200)
    }
  })

  it('treats empty optional numeric fields as undefined', () => {
    const result = recipeFormSchema.safeParse(
      validInput({ prep_time_minutes: '', weight_grams: '', difficulty: '' }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.prep_time_minutes).toBeUndefined()
      expect(result.data.weight_grams).toBeUndefined()
      expect(result.data.difficulty).toBeUndefined()
    }
  })

  it('defaults rating to 0 when left empty', () => {
    const result = recipeFormSchema.safeParse(validInput({ rating: '' }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.rating).toBe(0)
  })

  it('rejects rating above 5', () => {
    const result = recipeFormSchema.safeParse(validInput({ rating: '6' }))
    expect(result.success).toBe(false)
  })

  it('rejects negative quantities', () => {
    const result = recipeFormSchema.safeParse(
      validInput({ ingredients: [{ name_en: 'Salt', name_sr: '', quantity: '-5', unit_en: '', unit_sr: '' }] }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects an invalid difficulty value', () => {
    const result = recipeFormSchema.safeParse(validInput({ difficulty: 'impossible' }))
    expect(result.success).toBe(false)
  })
})

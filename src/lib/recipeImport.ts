import { z } from 'zod'
import type { CategoryWithCount } from '@/hooks/useCategories'
import type { IngredientWithCategory } from '@/hooks/useIngredients'
import type { SubcategoryWithCount } from '@/hooks/useSubcategories'
import type { Tag } from '@/hooks/useTags'
import { normalizeSearchText } from '@/lib/diacritics'
import { difficultyValues } from '@/lib/recipeFormSchema'
import type { RecipeFormState } from '@/lib/recipeFormState'
import { slugify } from '@/lib/slugify'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalNumeric = z.union([z.number(), z.string()]).optional()

const importIngredientSchema = z.object({
  name_sr: optionalText,
  name_en: z.string().trim().min(1, 'errors.ingredientNameRequired'),
  quantity: optionalNumeric,
  unit_sr: optionalText,
  unit_en: optionalText,
})

const importStepSchema = z.object({
  text_sr: optionalText,
  text_en: z.string().trim().min(1, 'errors.stepTextRequired'),
})

export const recipeImportSchema = z.object({
  name_sr: optionalText,
  name_en: z.string().trim().min(1, 'errors.nameRequired'),
  slug: optionalText,
  description_sr: optionalText,
  description_en: optionalText,
  category: z.string().trim().min(1, 'errors.categoryRequired'),
  subcategory: optionalText,
  tags: z.array(z.string().trim()).optional(),
  prep_time_minutes: optionalNumeric,
  cook_time_minutes: optionalNumeric,
  servings: optionalNumeric,
  weight_grams: optionalNumeric,
  difficulty: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.enum(difficultyValues).optional(),
  ),
  rating: optionalNumeric,
  ingredients: z.array(importIngredientSchema).min(1, 'errors.ingredientsRequired'),
  steps: z.array(importStepSchema).min(1, 'errors.stepsRequired'),
  notes_sr: optionalText,
  notes_en: optionalText,
})

export type RecipeImportValues = z.infer<typeof recipeImportSchema>

export interface RecipeImportContext {
  categories: CategoryWithCount[]
  subcategories: SubcategoryWithCount[]
  tags: Tag[]
  ingredients: IngredientWithCategory[]
}

export interface RecipeImportResult {
  formState: RecipeFormState
  warnings: RecipeImportWarning[]
}

export type RecipeImportWarning =
  | { key: 'admin.recipeForm.importSubcategoryNotFound'; value: string }
  | { key: 'admin.recipeForm.importTagNotFound'; value: string }

export class RecipeImportError extends Error {
  messageKey: string
  params?: Record<string, string>

  constructor(messageKey: string, params?: Record<string, string>) {
    super(messageKey)
    this.name = 'RecipeImportError'
    this.messageKey = messageKey
    this.params = params
  }
}

// Folds Serbian diacritics (š/č/ć/ž/đ) to their ASCII stand-ins, matching
// how every other search/match in the app compares text — so an AI-generated
// name like "Corba" still links to a catalog entry stored as "Čorba".
function normalize(value: string): string {
  return normalizeSearchText(value.trim())
}

interface Sluggable {
  slug: string
  name_en: string
  name_sr: string | null
}

function matchBySlugOrName<T extends Sluggable>(items: T[], query: string): T | undefined {
  const q = normalize(query)
  return (
    items.find((item) => normalize(item.slug) === q) ??
    items.find((item) => normalize(item.name_en) === q) ??
    items.find((item) => item.name_sr !== null && normalize(item.name_sr) === q) ??
    items.find((item) => normalize(item.name_en).includes(q) || (item.name_sr !== null && normalize(item.name_sr).includes(q)))
  )
}

function numberToFormString(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return ''
  return String(value)
}

export function resolveRecipeImport(input: RecipeImportValues, context: RecipeImportContext): RecipeImportResult {
  const category = matchBySlugOrName(context.categories, input.category)
  if (!category) {
    throw new RecipeImportError('admin.recipeForm.importCategoryNotFound', { value: input.category })
  }

  const warnings: RecipeImportWarning[] = []

  let subcategoryId = ''
  if (input.subcategory) {
    const subcategory = matchBySlugOrName(
      context.subcategories.filter((item) => item.category_id === category.id),
      input.subcategory,
    )
    if (subcategory) {
      subcategoryId = subcategory.id
    } else {
      warnings.push({ key: 'admin.recipeForm.importSubcategoryNotFound', value: input.subcategory })
    }
  }

  const tagIds: string[] = []
  for (const tagQuery of input.tags ?? []) {
    const tag = matchBySlugOrName(context.tags, tagQuery)
    if (tag) {
      tagIds.push(tag.id)
    } else {
      warnings.push({ key: 'admin.recipeForm.importTagNotFound', value: tagQuery })
    }
  }

  const ingredients = input.ingredients.map((ingredient) => {
    const match = context.ingredients.find(
      (catalogItem) =>
        normalize(catalogItem.name_en) === normalize(ingredient.name_en) ||
        (ingredient.name_sr !== undefined &&
          catalogItem.name_sr !== null &&
          normalize(catalogItem.name_sr) === normalize(ingredient.name_sr)),
    )

    return {
      name_en: ingredient.name_en,
      name_sr: ingredient.name_sr ?? match?.name_sr ?? '',
      quantity: numberToFormString(ingredient.quantity),
      unit_en: ingredient.unit_en ?? match?.default_unit_en ?? '',
      unit_sr: ingredient.unit_sr ?? match?.default_unit_sr ?? '',
      ingredient_id: match?.id ?? '',
    }
  })

  const steps = input.steps.map((step) => ({
    text_en: step.text_en,
    text_sr: step.text_sr ?? '',
  }))

  const formState: RecipeFormState = {
    slug: slugify(input.slug || input.name_en),
    name_en: input.name_en,
    name_sr: input.name_sr ?? '',
    description_en: input.description_en ?? '',
    description_sr: input.description_sr ?? '',
    tips_en: input.notes_en ?? '',
    tips_sr: input.notes_sr ?? '',
    category_id: category.id,
    subcategory_id: subcategoryId,
    prep_time_minutes: numberToFormString(input.prep_time_minutes),
    cook_time_minutes: numberToFormString(input.cook_time_minutes),
    servings: numberToFormString(input.servings),
    weight_grams: numberToFormString(input.weight_grams),
    difficulty: input.difficulty ?? '',
    rating: numberToFormString(input.rating),
    tagIds,
    ingredients,
    steps,
  }

  return { formState, warnings }
}

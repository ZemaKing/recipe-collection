import { z } from 'zod'
import type { IngredientCategory, Mineral, Vitamin } from '@/types/ingredient'
import type { IngredientFormState } from '@/lib/ingredientFormState'
import { slugify } from '@/lib/slugify'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalNumeric = z.union([z.number(), z.string()]).optional()

const importVitaminSchema = z.object({
  vitamin: z.string().trim().min(1, 'errors.vitaminRequired'),
  amount: optionalNumeric,
})

const importMineralSchema = z.object({
  mineral: z.string().trim().min(1, 'errors.mineralRequired'),
  amount: optionalNumeric,
})

const importUnitConversionSchema = z.object({
  unit: z.string().trim().min(1, 'errors.unitConversionUnitRequired'),
  grams: optionalNumeric,
})

export const ingredientImportSchema = z.object({
  name_sr: optionalText,
  name_en: z.string().trim().min(1, 'errors.nameRequired'),
  slug: optionalText,
  latin_name: optionalText,
  regional_names: optionalText,
  category: optionalText,
  fact_sr: optionalText,
  fact_en: optionalText,
  default_unit_sr: optionalText,
  default_unit_en: optionalText,
  calories_kcal: optionalNumeric,
  protein_g: optionalNumeric,
  fat_g: optionalNumeric,
  carbs_g: optionalNumeric,
  fiber_g: optionalNumeric,
  vitamins: z.array(importVitaminSchema).optional(),
  minerals: z.array(importMineralSchema).optional(),
  unit_conversions: z.array(importUnitConversionSchema).optional(),
})

export type IngredientImportValues = z.infer<typeof ingredientImportSchema>

export interface IngredientImportContext {
  categories: IngredientCategory[]
  vitamins: Vitamin[]
  minerals: Mineral[]
}

export interface IngredientImportResult {
  formState: IngredientFormState
  warnings: IngredientImportWarning[]
}

export type IngredientImportWarning =
  | { key: 'admin.ingredients.importCategoryNotFound'; value: string }
  | { key: 'admin.ingredients.importVitaminNotFound'; value: string }
  | { key: 'admin.ingredients.importMineralNotFound'; value: string }

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function matchCategory(categories: IngredientCategory[], query: string): IngredientCategory | undefined {
  const q = normalize(query)
  return (
    categories.find((item) => normalize(item.slug) === q) ??
    categories.find((item) => normalize(item.name_en) === q) ??
    categories.find((item) => item.name_sr !== null && normalize(item.name_sr) === q) ??
    categories.find(
      (item) => normalize(item.name_en).includes(q) || (item.name_sr !== null && normalize(item.name_sr).includes(q)),
    )
  )
}

function matchMicronutrient<T extends { code: string; name_en: string; name_sr: string }>(
  items: T[],
  query: string,
): T | undefined {
  const q = normalize(query)
  return (
    items.find((item) => normalize(item.code) === q) ??
    items.find((item) => normalize(item.name_en) === q) ??
    items.find((item) => normalize(item.name_sr) === q) ??
    items.find((item) => normalize(item.name_en).includes(q) || normalize(item.name_sr).includes(q))
  )
}

function numberToFormString(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return ''
  return String(value)
}

export function resolveIngredientImport(
  input: IngredientImportValues,
  context: IngredientImportContext,
): IngredientImportResult {
  const warnings: IngredientImportWarning[] = []

  let categoryId = ''
  if (input.category) {
    const category = matchCategory(context.categories, input.category)
    if (category) {
      categoryId = category.id
    } else {
      warnings.push({ key: 'admin.ingredients.importCategoryNotFound', value: input.category })
    }
  }

  const vitamins = (input.vitamins ?? []).flatMap((row) => {
    const match = matchMicronutrient(context.vitamins, row.vitamin)
    if (!match) {
      warnings.push({ key: 'admin.ingredients.importVitaminNotFound', value: row.vitamin })
      return []
    }
    return [{ vitamin_id: match.id, amount: numberToFormString(row.amount) }]
  })

  const minerals = (input.minerals ?? []).flatMap((row) => {
    const match = matchMicronutrient(context.minerals, row.mineral)
    if (!match) {
      warnings.push({ key: 'admin.ingredients.importMineralNotFound', value: row.mineral })
      return []
    }
    return [{ mineral_id: match.id, amount: numberToFormString(row.amount) }]
  })

  const unitConversions = (input.unit_conversions ?? []).map((row) => ({
    unit: row.unit,
    grams: numberToFormString(row.grams),
  }))

  const formState: IngredientFormState = {
    slug: slugify(input.slug || input.name_en),
    name_en: input.name_en,
    name_sr: input.name_sr ?? '',
    latin_name: input.latin_name ?? '',
    regional_names: input.regional_names ?? '',
    fact_en: input.fact_en ?? '',
    fact_sr: input.fact_sr ?? '',
    default_unit_en: input.default_unit_en ?? '',
    default_unit_sr: input.default_unit_sr ?? '',
    ingredient_category_id: categoryId,
    calories_kcal: numberToFormString(input.calories_kcal),
    protein_g: numberToFormString(input.protein_g),
    fat_g: numberToFormString(input.fat_g),
    carbs_g: numberToFormString(input.carbs_g),
    fiber_g: numberToFormString(input.fiber_g),
    vitamins,
    minerals,
    unitConversions,
  }

  return { formState, warnings }
}

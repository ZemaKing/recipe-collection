import { z } from 'zod'

export const difficultyValues = ['easy', 'medium', 'hard'] as const

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalNonNegativeInt = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z
    .number('errors.mustBeNumber')
    .int('errors.mustBeWholeNumber')
    .nonnegative('errors.mustBeNonNegative')
    .optional(),
)

const optionalNonNegativeNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number('errors.mustBeNumber').nonnegative('errors.mustBeNonNegative').optional(),
)

const optionalDifficulty = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.enum(difficultyValues).optional(),
)

export const ingredientSchema = z.object({
  name_en: z.string().trim().min(1, 'errors.ingredientNameRequired'),
  name_sr: optionalText,
  quantity: optionalNonNegativeNumber,
  unit_en: optionalText,
  unit_sr: optionalText,
  // Set when the admin picked a catalog match via autocomplete; left
  // unset for plain free-text ingredient names (fully backward compatible).
  ingredient_id: optionalText,
})

export const stepSchema = z.object({
  text_en: z.string().trim().min(1, 'errors.stepTextRequired'),
  text_sr: optionalText,
})

export const recipeFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'errors.slugRequired')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'errors.slugInvalid'),
  name_en: z.string().trim().min(1, 'errors.nameRequired'),
  name_sr: optionalText,
  description_en: optionalText,
  description_sr: optionalText,
  tips_en: optionalText,
  tips_sr: optionalText,
  category_id: z.string().trim().min(1, 'errors.categoryRequired'),
  prep_time_minutes: optionalNonNegativeInt,
  cook_time_minutes: optionalNonNegativeInt,
  servings: optionalNonNegativeInt,
  weight_grams: optionalNonNegativeInt,
  difficulty: optionalDifficulty,
  rating: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? 0 : Number(value)),
    z.number('errors.mustBeNumber').min(0, 'errors.ratingRange').max(5, 'errors.ratingRange'),
  ),
  tagIds: z.array(z.string()).default([]),
  ingredients: z.array(ingredientSchema).min(1, 'errors.ingredientsRequired'),
  steps: z.array(stepSchema).min(1, 'errors.stepsRequired'),
})

export type RecipeFormValues = z.infer<typeof recipeFormSchema>
export type RecipeFormInput = z.input<typeof recipeFormSchema>

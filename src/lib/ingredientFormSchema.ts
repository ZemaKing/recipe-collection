import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

const optionalNonNegativeNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number('errors.mustBeNumber').nonnegative('errors.mustBeNonNegative').optional(),
)

const micronutrientRowSchema = z.object({
  key: z.string().trim().min(1, 'errors.micronutrientKeyRequired'),
  amount: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number('errors.mustBeNumber').nonnegative('errors.mustBeNonNegative'),
  ),
  unit: z.string().trim().min(1, 'errors.micronutrientUnitRequired'),
})

const unitConversionRowSchema = z.object({
  unit: z.string().trim().min(1, 'errors.unitConversionUnitRequired'),
  grams: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number('errors.mustBeNumber').positive('errors.mustBePositive'),
  ),
})

export const ingredientFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'errors.slugRequired')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'errors.slugInvalid'),
  name_en: z.string().trim().min(1, 'errors.nameRequired'),
  name_sr: optionalText,
  latin_name: optionalText,
  regional_names: optionalText,
  fact_en: optionalText,
  fact_sr: optionalText,
  default_unit_en: optionalText,
  default_unit_sr: optionalText,
  ingredient_category_id: optionalText,
  calories_kcal: optionalNonNegativeNumber,
  protein_g: optionalNonNegativeNumber,
  fat_g: optionalNonNegativeNumber,
  carbs_g: optionalNonNegativeNumber,
  fiber_g: optionalNonNegativeNumber,
  micronutrients: z.array(micronutrientRowSchema).default([]),
  unitConversions: z.array(unitConversionRowSchema).default([]),
})

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>
export type IngredientFormInput = z.input<typeof ingredientFormSchema>

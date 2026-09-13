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

const nonNegativeAmount = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number('errors.mustBeNumber').nonnegative('errors.mustBeNonNegative'),
)

const vitaminRowSchema = z.object({
  vitamin_id: z.string().trim().min(1),
  amount: nonNegativeAmount,
})

const mineralRowSchema = z.object({
  mineral_id: z.string().trim().min(1),
  amount: nonNegativeAmount,
})

const unitConversionRowSchema = z.object({
  unit: z.string().trim().min(1, 'errors.unitConversionUnitRequired'),
  grams: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number('errors.mustBeNumber').positive('errors.mustBePositive'),
  ),
})

export const ingredientFormSchema = z
  .object({
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
    vitamins: z.array(vitaminRowSchema).default([]),
    minerals: z.array(mineralRowSchema).default([]),
    unitConversions: z.array(unitConversionRowSchema).default([]),
  })
  .superRefine((value, ctx) => {
    const seenVitaminIds = new Set<string>()
    value.vitamins.forEach((row, index) => {
      if (seenVitaminIds.has(row.vitamin_id)) {
        ctx.addIssue({ code: 'custom', message: 'errors.duplicateVitamin', path: ['vitamins', index, 'vitamin_id'] })
      }
      seenVitaminIds.add(row.vitamin_id)
    })

    const seenMineralIds = new Set<string>()
    value.minerals.forEach((row, index) => {
      if (seenMineralIds.has(row.mineral_id)) {
        ctx.addIssue({ code: 'custom', message: 'errors.duplicateMineral', path: ['minerals', index, 'mineral_id'] })
      }
      seenMineralIds.add(row.mineral_id)
    })
  })

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>
export type IngredientFormInput = z.input<typeof ingredientFormSchema>

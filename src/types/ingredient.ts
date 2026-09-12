export interface MicronutrientAmount {
  amount: number
  unit: string
}

export interface IngredientCategory {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

export interface Ingredient {
  id: string
  slug: string
  ingredient_category_id: string | null
  name_en: string
  name_sr: string | null
  latin_name: string | null
  regional_names: string | null
  fact_en: string | null
  fact_sr: string | null
  default_unit_en: string | null
  default_unit_sr: string | null
  calories_kcal: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
  micronutrients: Record<string, MicronutrientAmount>
  unit_conversions: Record<string, number>
  image_storage_path: string | null
  image_alt_en: string | null
  image_alt_sr: string | null
}

// The subset of an ingredient's data needed to compute nutrition for a
// recipe — nested onto a RecipeIngredient row via the ingredient_id FK.
export interface IngredientNutritionRef {
  calories_kcal: number | null
  protein_g: number | null
  fat_g: number | null
  carbs_g: number | null
  fiber_g: number | null
  micronutrients: Record<string, MicronutrientAmount>
  unit_conversions: Record<string, number>
}

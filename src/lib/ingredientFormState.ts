export interface MicronutrientRow {
  key: string
  amount: string
  unit: string
}

export interface UnitConversionRow {
  unit: string
  grams: string
}

export interface IngredientFormState {
  slug: string
  name_en: string
  name_sr: string
  latin_name: string
  regional_names: string
  fact_en: string
  fact_sr: string
  default_unit_en: string
  default_unit_sr: string
  ingredient_category_id: string
  calories_kcal: string
  protein_g: string
  fat_g: string
  carbs_g: string
  fiber_g: string
  micronutrients: MicronutrientRow[]
  unitConversions: UnitConversionRow[]
}

export const EMPTY_INGREDIENT_FORM_STATE: IngredientFormState = {
  slug: '',
  name_en: '',
  name_sr: '',
  latin_name: '',
  regional_names: '',
  fact_en: '',
  fact_sr: '',
  default_unit_en: '',
  default_unit_sr: '',
  ingredient_category_id: '',
  calories_kcal: '',
  protein_g: '',
  fat_g: '',
  carbs_g: '',
  fiber_g: '',
  micronutrients: [],
  unitConversions: [],
}

import type { AdminRecipeDetail, AdminRecipeIngredient } from '@/hooks/useAdminRecipe'

export type RecipeFormState = Omit<AdminRecipeDetail, 'id'>

export const EMPTY_INGREDIENT: AdminRecipeIngredient = {
  name_en: '',
  name_sr: '',
  quantity: '',
  unit_en: '',
  unit_sr: '',
  ingredient_id: '',
}

export const EMPTY_RECIPE_FORM_STATE: RecipeFormState = {
  slug: '',
  name_en: '',
  name_sr: '',
  description_en: '',
  description_sr: '',
  tips_en: '',
  tips_sr: '',
  category_id: '',
  prep_time_minutes: '',
  cook_time_minutes: '',
  servings: '',
  weight_grams: '',
  difficulty: '',
  rating: '',
  tagIds: [],
  ingredients: [{ ...EMPTY_INGREDIENT }],
  steps: [{ text_en: '', text_sr: '' }],
}

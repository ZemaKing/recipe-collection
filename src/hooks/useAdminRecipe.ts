import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Difficulty } from '@/hooks/useRecipeBySlug'

export interface AdminRecipeIngredient {
  name_en: string
  name_sr: string
  quantity: string
  unit_en: string
  unit_sr: string
  ingredient_id: string
}

export interface AdminRecipeStep {
  text_en: string
  text_sr: string
}

export interface AdminRecipeDetail {
  id: string
  slug: string
  name_en: string
  name_sr: string
  description_en: string
  description_sr: string
  tips_en: string
  tips_sr: string
  category_id: string
  prep_time_minutes: string
  cook_time_minutes: string
  servings: string
  weight_grams: string
  difficulty: Difficulty | ''
  rating: string
  tagIds: string[]
  ingredients: AdminRecipeIngredient[]
  steps: AdminRecipeStep[]
}

const ADMIN_RECIPE_SELECT = `
  id, slug, name_en, name_sr, description_en, description_sr, tips_en, tips_sr,
  category_id, prep_time_minutes, cook_time_minutes, servings, weight_grams, difficulty, rating,
  ingredients:recipe_ingredients(order_index, name_en, name_sr, quantity, unit_en, unit_sr, ingredient_id),
  steps:recipe_steps(step_number, text_en, text_sr),
  recipe_tags(tag_id)
`

function toStr(value: number | null): string {
  return value === null || value === undefined ? '' : String(value)
}

export function useAdminRecipe(slug: string | undefined) {
  const [recipe, setRecipe] = useState<AdminRecipeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(!!slug)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // No slug (create mode) — initial state (recipe: null, isLoading: false)
    // is already correct, nothing to fetch or reset.
    if (!slug) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setNotFound(false)

      const { data, error } = await supabase
        .from('recipes')
        .select(ADMIN_RECIPE_SELECT)
        .eq('slug', slug)
        .order('order_index', { referencedTable: 'recipe_ingredients' })
        .order('step_number', { referencedTable: 'recipe_steps' })
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setError(error.message)
      } else if (!data) {
        setNotFound(true)
      } else {
        setRecipe({
          id: data.id,
          slug: data.slug,
          name_en: data.name_en,
          name_sr: data.name_sr ?? '',
          description_en: data.description_en ?? '',
          description_sr: data.description_sr ?? '',
          tips_en: data.tips_en ?? '',
          tips_sr: data.tips_sr ?? '',
          category_id: data.category_id,
          prep_time_minutes: toStr(data.prep_time_minutes),
          cook_time_minutes: toStr(data.cook_time_minutes),
          servings: toStr(data.servings),
          weight_grams: toStr(data.weight_grams),
          difficulty: data.difficulty ?? '',
          rating: toStr(data.rating),
          tagIds: (data.recipe_tags as { tag_id: string }[]).map((row) => row.tag_id),
          ingredients: (
            data.ingredients as {
              name_en: string
              name_sr: string | null
              quantity: number | null
              unit_en: string | null
              unit_sr: string | null
              ingredient_id: string | null
            }[]
          ).map((ing) => ({
            name_en: ing.name_en,
            name_sr: ing.name_sr ?? '',
            quantity: toStr(ing.quantity),
            unit_en: ing.unit_en ?? '',
            unit_sr: ing.unit_sr ?? '',
            ingredient_id: ing.ingredient_id ?? '',
          })),
          steps: (data.steps as { text_en: string; text_sr: string | null }[]).map((step) => ({
            text_en: step.text_en,
            text_sr: step.text_sr ?? '',
          })),
        })
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return { recipe, isLoading, notFound, error }
}

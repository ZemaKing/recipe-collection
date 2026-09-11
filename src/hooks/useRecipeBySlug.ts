import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface RecipeIngredient {
  id: string
  order_index: number
  name_en: string
  name_sr: string | null
  quantity: number | null
  unit_en: string | null
  unit_sr: string | null
}

export interface RecipeStep {
  id: string
  step_number: number
  text_en: string
  text_sr: string | null
}

export interface RecipeDetail {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  description_en: string | null
  description_sr: string | null
  prep_notes_en: string | null
  prep_notes_sr: string | null
  tips_en: string | null
  tips_sr: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
  weight_grams: number | null
  difficulty: Difficulty | null
  rating: number
  is_favorite: boolean
  category: { slug: string; name_en: string; name_sr: string | null } | null
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
}

const RECIPE_DETAIL_SELECT = `
  id, slug, name_en, name_sr, description_en, description_sr,
  prep_notes_en, prep_notes_sr, tips_en, tips_sr,
  prep_time_minutes, cook_time_minutes, servings, weight_grams, difficulty, rating, is_favorite,
  category:categories(slug, name_en, name_sr),
  ingredients:recipe_ingredients(id, order_index, name_en, name_sr, quantity, unit_en, unit_sr),
  steps:recipe_steps(id, step_number, text_en, text_sr)
`

export function useRecipeBySlug(slug: string) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setNotFound(false)

      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_DETAIL_SELECT)
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
        setRecipe(data as unknown as RecipeDetail)
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

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Ingredient } from '@/types/ingredient'

export interface IngredientWithCategory extends Ingredient {
  ingredient_category: { slug: string; name_en: string; name_sr: string | null } | null
}

const INGREDIENT_SELECT = `
  id, slug, ingredient_category_id, name_en, name_sr, latin_name, regional_names, fact_en, fact_sr,
  default_unit_en, default_unit_sr, calories_kcal, protein_g, fat_g, carbs_g, fiber_g,
  micronutrients, unit_conversions, image_storage_path, image_alt_en, image_alt_sr,
  ingredient_category:ingredient_categories(slug, name_en, name_sr)
`

// Catalog is expected to stay modest-sized for a personal app, so fetch it
// all at once and filter/search client-side rather than server-side
// pagination (matches the small-dataset hooks like useTags/useCategories).
export function useIngredients() {
  const [ingredients, setIngredients] = useState<IngredientWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase.from('ingredients').select(INGREDIENT_SELECT).order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        setIngredients((data ?? []) as unknown as IngredientWithCategory[])
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [refetchToken])

  function refetch() {
    setRefetchToken((token) => token + 1)
  }

  return { ingredients, isLoading, error, refetch }
}

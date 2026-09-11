import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface RecipeOption {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

// Lightweight recipe list for admin pickers (e.g. meal plan assignment) —
// intentionally skips images/ingredients/tags that RecipeSummary carries.
export function useRecipeOptions() {
  const [options, setOptions] = useState<RecipeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('recipes')
        .select('id, slug, name_en, name_sr')
        .order('name_en', { ascending: true })

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setOptions((data ?? []) as RecipeOption[])
        setError(null)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { options, isLoading, error }
}

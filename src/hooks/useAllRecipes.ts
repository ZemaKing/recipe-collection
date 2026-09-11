import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { RECIPE_SUMMARY_SELECT } from '@/lib/recipeQueries'
import type { RecipeSummary } from '@/types/recipe'

export function useAllRecipes() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_SUMMARY_SELECT)
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setRecipes((data ?? []) as unknown as RecipeSummary[])
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { recipes, isLoading, error }
}

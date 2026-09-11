import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { QuickFilter } from '@/components/recipes/QuickFilterChips'
import { mapRecipeSummaryRow, RECIPE_SUMMARY_SELECT, type RawImageRow } from '@/lib/recipeQueries'
import type { RecipeSummary } from '@/types/recipe'

export type { RecipeSummary as RecentRecipe } from '@/types/recipe'

const RECENT_LIMIT = 8

// Each filter re-queries rather than filtering the already-limited "recent"
// set client-side, otherwise e.g. a favorite outside the 8 most recent
// recipes would silently disappear from the "Omiljeni" chip.
export function useRecentRecipes(filter: QuickFilter) {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      let query = supabase.from('recipes').select(RECIPE_SUMMARY_SELECT).limit(RECENT_LIMIT)

      query =
        filter === 'topRated'
          ? query.order('rating', { ascending: false })
          : query.order('created_at', { ascending: false })

      if (filter === 'favorites') {
        query = query.eq('is_favorite', true)
      }

      const { data, error } = await query

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        const rows = (data ?? []) as unknown as (Omit<RecipeSummary, 'image'> & { images: RawImageRow[] })[]
        setRecipes(rows.map(mapRecipeSummaryRow))
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [filter])

  return { recipes, isLoading, error }
}

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { QuickFilter } from '@/components/recipes/QuickFilterChips'

export interface RecentRecipe {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  rating: number
  is_favorite: boolean
  category: { slug: string; name_en: string; name_sr: string | null } | null
}

const RECENT_LIMIT = 8

// Each filter re-queries rather than filtering the already-limited "recent"
// set client-side, otherwise e.g. a favorite outside the 8 most recent
// recipes would silently disappear from the "Omiljeni" chip.
export function useRecentRecipes(filter: QuickFilter) {
  const [recipes, setRecipes] = useState<RecentRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      let query = supabase
        .from('recipes')
        .select(
          'id, slug, name_en, name_sr, prep_time_minutes, cook_time_minutes, rating, is_favorite, category:categories(slug, name_en, name_sr)',
        )
        .limit(RECENT_LIMIT)

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
        setRecipes((data ?? []) as unknown as RecentRecipe[])
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

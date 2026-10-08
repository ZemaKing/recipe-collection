import { useEffect, useState } from 'react'
import { favoriteIdsKey, idsFromKey } from '@/lib/localFavorites'
import { supabase } from '@/lib/supabaseClient'

export interface RecipeStats {
  recipeCount: number
  categoryCount: number
  favoriteCount: number
  noteCount: number
}

const EMPTY_STATS: RecipeStats = {
  recipeCount: 0,
  categoryCount: 0,
  favoriteCount: 0,
  noteCount: 0,
}

// localIds: the visitor's favourites (see useFavorites); null for the admin,
// whose favourite count comes from the is_favorite column.
export function useRecipeStats(localIds: readonly string[] | null) {
  const [stats, setStats] = useState<RecipeStats>(EMPTY_STATS)
  const [localFavoriteCount, setLocalFavoriteCount] = useState(0)
  const localIdsKey = favoriteIdsKey(localIds)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const [recipeCount, categoryCount, favoriteCount, noteCount] = await Promise.all([
        supabase.from('recipes').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('is_favorite', true),
        supabase.from('kitchen_notes').select('*', { count: 'exact', head: true }),
      ])

      if (cancelled) return
      setStats({
        recipeCount: recipeCount.count ?? 0,
        categoryCount: categoryCount.count ?? 0,
        favoriteCount: favoriteCount.count ?? 0,
        noteCount: noteCount.count ?? 0,
      })
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Counted against the table (not localIds.length) so ids of recipes that
  // were deleted since the visitor saved them don't inflate the number.
  useEffect(() => {
    if (localIdsKey === null) return
    let cancelled = false

    async function load(key: string) {
      const ids = idsFromKey(key)
      let count = 0
      if (ids.length > 0) {
        const result = await supabase.from('recipes').select('*', { count: 'exact', head: true }).in('id', ids)
        count = result.count ?? 0
      }
      if (!cancelled) setLocalFavoriteCount(count)
    }

    void load(localIdsKey)
    return () => {
      cancelled = true
    }
  }, [localIdsKey])

  return {
    stats: localIdsKey === null ? stats : { ...stats, favoriteCount: localFavoriteCount },
    isLoading,
  }
}

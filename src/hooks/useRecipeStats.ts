import { useEffect, useState } from 'react'
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

export function useRecipeStats() {
  const [stats, setStats] = useState<RecipeStats>(EMPTY_STATS)
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

  return { stats, isLoading }
}

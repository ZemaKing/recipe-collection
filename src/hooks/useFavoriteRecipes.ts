import { useEffect, useState } from 'react'
import { favoriteIdsKey, idsFromKey } from '@/lib/localFavorites'
import { mapRecipeSummaryRow, RECIPE_SUMMARY_SELECT, type RawImageRow } from '@/lib/recipeQueries'
import { supabase } from '@/lib/supabaseClient'
import type { RecipeSummary } from '@/types/recipe'

// localIds: the visitor's favourites (see useFavorites); null for the admin,
// whose favourites are the is_favorite column.
export function useFavoriteRecipes(localIds: readonly string[] | null) {
  const localIdsKey = favoriteIdsKey(localIds)
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      let query = supabase.from('recipes').select(RECIPE_SUMMARY_SELECT).order('created_at', { ascending: false })
      if (localIdsKey === null) {
        query = query.eq('is_favorite', true)
      } else {
        const ids = idsFromKey(localIdsKey)
        if (ids.length === 0) {
          setRecipes([])
          setIsLoading(false)
          return
        }
        query = query.in('id', ids)
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
  }, [localIdsKey])

  async function toggleFavorite(recipeId: string) {
    const current = recipes.find((recipe) => recipe.id === recipeId)
    if (!current) return

    // Unfavoriting here means the recipe should drop out of this list
    // entirely, rather than just flipping a flag on a still-visible card.
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId))

    const { error } = await supabase.from('recipes').update({ is_favorite: false }).eq('id', recipeId)
    if (error) {
      setRecipes((prev) => [current, ...prev])
    }
  }

  return { recipes, isLoading, error, toggleFavorite }
}

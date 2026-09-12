import { useEffect, useState } from 'react'
import { mapRecipeSummaryRow, RECIPE_SUMMARY_SELECT, type RawImageRow } from '@/lib/recipeQueries'
import { supabase } from '@/lib/supabaseClient'
import type { RecipeSummary } from '@/types/recipe'

export function useFavoriteRecipes() {
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
        .eq('is_favorite', true)
        .order('created_at', { ascending: false })

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
  }, [])

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

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { mapRecipeSummaryRow, SEARCHABLE_RECIPE_SELECT, type RawImageRow } from '@/lib/recipeQueries'
import type { SearchableRecipe } from '@/types/recipe'

interface RawTagRow {
  tags: { slug: string } | null
}

export function useAllRecipes() {
  const [recipes, setRecipes] = useState<SearchableRecipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('recipes')
        .select(SEARCHABLE_RECIPE_SELECT)
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        const rows = (data ?? []) as unknown as (Omit<SearchableRecipe, 'image'> & {
          images: RawImageRow[]
          recipe_tags: RawTagRow[]
        })[]
        setRecipes(
          rows.map(({ recipe_tags, ...row }) => ({
            ...mapRecipeSummaryRow(row),
            tagSlugs: recipe_tags.map((tagRow) => tagRow.tags?.slug).filter((slug): slug is string => !!slug),
          })),
        )
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
    const nextValue = !current.is_favorite

    setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, is_favorite: nextValue } : r)))

    const { error } = await supabase.from('recipes').update({ is_favorite: nextValue }).eq('id', recipeId)
    if (error) {
      setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, is_favorite: current.is_favorite } : r)))
    }
  }

  return { recipes, isLoading, error, toggleFavorite }
}

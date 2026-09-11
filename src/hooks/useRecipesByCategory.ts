import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { RECIPE_SUMMARY_SELECT } from '@/lib/recipeQueries'
import type { RecipeSummary } from '@/types/recipe'

interface CategoryInfo {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

export function useRecipesByCategory(slug: string) {
  const [category, setCategory] = useState<CategoryInfo | null>(null)
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setNotFound(false)

      const { data: categoryRow, error: categoryError } = await supabase
        .from('categories')
        .select('id, slug, name_en, name_sr')
        .eq('slug', slug)
        .maybeSingle()

      if (cancelled) return

      if (categoryError) {
        setError(categoryError.message)
        setIsLoading(false)
        return
      }

      if (!categoryRow) {
        setCategory(null)
        setRecipes([])
        setNotFound(true)
        setIsLoading(false)
        return
      }

      setCategory(categoryRow)

      const { data: recipeRows, error: recipesError } = await supabase
        .from('recipes')
        .select(RECIPE_SUMMARY_SELECT)
        .eq('category_id', categoryRow.id)
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (recipesError) {
        setError(recipesError.message)
      } else {
        setRecipes((recipeRows ?? []) as unknown as RecipeSummary[])
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return { category, recipes, isLoading, notFound, error }
}

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface CategoryWithCount {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  recipeCount: number
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name_en, name_sr, recipes(count)')
        .order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setCategories(
          (data ?? []).map((row) => {
            const recipes = row.recipes as unknown as { count: number }[]
            return {
              id: row.id,
              slug: row.slug,
              name_en: row.name_en,
              name_sr: row.name_sr,
              recipeCount: recipes?.[0]?.count ?? 0,
            }
          }),
        )
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { categories, isLoading, error }
}

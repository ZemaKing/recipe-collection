import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Subcategory } from '@/types/recipe'

export interface SubcategoryWithCount extends Subcategory {
  recipeCount: number
}

interface SubcategoryRow extends Subcategory {
  recipes: { count: number }[]
}

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState<SubcategoryWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, category_id, slug, name_en, name_sr, recipes(count)')
        .order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        const rows = (data ?? []) as unknown as SubcategoryRow[]
        setSubcategories(rows.map(({ recipes, ...rest }) => ({ ...rest, recipeCount: recipes?.[0]?.count ?? 0 })))
        setError(null)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { subcategories, isLoading, error }
}

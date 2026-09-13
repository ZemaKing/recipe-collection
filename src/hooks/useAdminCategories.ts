import { useEffect, useState } from 'react'
import { compareCategoryOrder } from '@/lib/categoryOrder'
import { supabase } from '@/lib/supabaseClient'

export interface AdminCategory {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  recipeCount: number
}

interface AdminCategoryRow {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  recipes: { count: number }[]
}

export function useAdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

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
        const rows = (data ?? []) as unknown as AdminCategoryRow[]
        const mapped = rows.map(({ recipes, ...rest }) => ({ ...rest, recipeCount: recipes?.[0]?.count ?? 0 }))
        setCategories(mapped.sort((a, b) => compareCategoryOrder(a.slug, b.slug)))
        setError(null)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [refetchToken])

  function refetch() {
    setRefetchToken((token) => token + 1)
  }

  return { categories, isLoading, error, refetch }
}

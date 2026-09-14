import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface AdminSubcategory {
  id: string
  category_id: string
  slug: string
  name_en: string
  name_sr: string | null
  category: { slug: string; name_en: string; name_sr: string | null } | null
  recipeCount: number
}

interface AdminSubcategoryRow {
  id: string
  category_id: string
  slug: string
  name_en: string
  name_sr: string | null
  categories: { slug: string; name_en: string; name_sr: string | null } | null
  recipes: { count: number }[]
}

export function useAdminSubcategories() {
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, category_id, slug, name_en, name_sr, categories(slug, name_en, name_sr), recipes(count)')
        .order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        const rows = (data ?? []) as unknown as AdminSubcategoryRow[]
        setSubcategories(
          rows.map(({ categories, recipes, ...rest }) => ({
            ...rest,
            category: categories,
            recipeCount: recipes?.[0]?.count ?? 0,
          })),
        )
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

  return { subcategories, isLoading, error, refetch }
}

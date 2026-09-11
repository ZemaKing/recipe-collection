import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface AdminRecipeListItem {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  category: { name_en: string; name_sr: string | null } | null
}

export function useAdminRecipes() {
  const [recipes, setRecipes] = useState<AdminRecipeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('recipes')
        .select('id, slug, name_en, name_sr, category:categories(name_en, name_sr)')
        .order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setRecipes((data ?? []) as unknown as AdminRecipeListItem[])
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { recipes, isLoading, error }
}

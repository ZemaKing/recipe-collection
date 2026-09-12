import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { IngredientCategory } from '@/types/ingredient'

export function useIngredientCategories() {
  const [categories, setCategories] = useState<IngredientCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data } = await supabase
        .from('ingredient_categories')
        .select('id, slug, name_en, name_sr')
        .order('name_en')
      if (cancelled) return
      setCategories(data ?? [])
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { categories, isLoading }
}

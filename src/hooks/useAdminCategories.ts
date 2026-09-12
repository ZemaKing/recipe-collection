import { useEffect, useState } from 'react'
import { compareCategoryOrder } from '@/lib/categoryOrder'
import { supabase } from '@/lib/supabaseClient'

export interface AdminCategory {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
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
        .select('id, slug, name_en, name_sr')
        .order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setCategories([...(data ?? [])].sort((a, b) => compareCategoryOrder(a.slug, b.slug)))
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

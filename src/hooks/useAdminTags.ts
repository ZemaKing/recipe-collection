import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface AdminTag {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  recipeCount: number
}

interface AdminTagRow {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  recipe_tags: { count: number }[]
}

export function useAdminTags() {
  const [tags, setTags] = useState<AdminTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tags')
        .select('id, slug, name_en, name_sr, recipe_tags(count)')
        .order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        const rows = (data ?? []) as unknown as AdminTagRow[]
        setTags(rows.map(({ recipe_tags, ...rest }) => ({ ...rest, recipeCount: recipe_tags?.[0]?.count ?? 0 })))
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

  return { tags, isLoading, error, refetch }
}

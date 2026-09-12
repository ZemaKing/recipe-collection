import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface AdminTag {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
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
      const { data, error } = await supabase.from('tags').select('id, slug, name_en, name_sr').order('name_en')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setTags(data ?? [])
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

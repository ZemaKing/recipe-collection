import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Tag {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data } = await supabase.from('tags').select('id, slug, name_en, name_sr').order('name_en')
      if (cancelled) return
      setTags(data ?? [])
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { tags, isLoading }
}

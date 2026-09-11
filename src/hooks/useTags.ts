import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Tag {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

// Tags aren't editable from the UI, so a simple module-level cache is safe
// for the session. This also dedupes the fetch when multiple consumers
// mount at once (e.g. the sidebar's quick filters and the browse page both
// call useTags on the same navigation).
let cachedTags: Tag[] | null = null
let pendingFetch: Promise<Tag[]> | null = null

async function fetchTags(): Promise<Tag[]> {
  const { data } = await supabase.from('tags').select('id, slug, name_en, name_sr').order('name_en')
  return data ?? []
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>(cachedTags ?? [])
  const [isLoading, setIsLoading] = useState(cachedTags === null)

  useEffect(() => {
    if (cachedTags) return

    let cancelled = false
    pendingFetch ??= fetchTags()
    void pendingFetch.then((data) => {
      cachedTags = data
      pendingFetch = null
      if (!cancelled) {
        setTags(data)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { tags, isLoading }
}

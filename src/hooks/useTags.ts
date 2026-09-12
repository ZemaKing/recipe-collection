import { useEffect, useState } from 'react'
import { PINNED_TAG_SLUG } from '@/lib/tagIcons'
import { supabase } from '@/lib/supabaseClient'

export interface Tag {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

// A simple module-level cache dedupes the fetch when multiple consumers
// mount at once (e.g. the sidebar's quick filters and the browse page both
// call useTags on the same navigation). Admin tag edits call
// invalidateTagsCache() so the next mount picks up fresh data.
let cachedTags: Tag[] | null = null
let pendingFetch: Promise<Tag[]> | null = null

export function invalidateTagsCache() {
  cachedTags = null
}

async function fetchTags(): Promise<Tag[]> {
  const { data } = await supabase.from('tags').select('id, slug, name_en, name_sr').order('name_en')
  const tags = data ?? []
  // Pin one tag to the front regardless of alphabetical order; the rest
  // keep the query's alphabetical order (stable sort).
  const pinnedIndex = tags.findIndex((tag) => tag.slug === PINNED_TAG_SLUG)
  if (pinnedIndex > 0) {
    const [pinned] = tags.splice(pinnedIndex, 1)
    tags.unshift(pinned)
  }
  return tags
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

import { useSharedQuery } from '@/hooks/useSharedQuery'
import { createSharedQuery } from '@/lib/sharedQuery'
import { PINNED_TAG_SLUG } from '@/lib/tagIcons'
import { supabase } from '@/lib/supabaseClient'

export interface Tag {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
}

// Shared: the sidebar's quick filters and the browse page ask on the same
// navigation. Revalidated on every mount, so admin tag edits show up without
// invalidation.
const tagsQuery = createSharedQuery(async (): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from('tags')
    .select('id, slug, name_en, name_sr')
    .order('name_en')
  if (error) throw new Error(error.message)
  const tags = data ?? []
  // Pin one tag to the front regardless of alphabetical order; the rest
  // keep the query's alphabetical order (stable sort).
  const pinnedIndex = tags.findIndex((tag) => tag.slug === PINNED_TAG_SLUG)
  if (pinnedIndex > 0) {
    const [pinned] = tags.splice(pinnedIndex, 1)
    tags.unshift(pinned)
  }
  return tags
})

const NO_TAGS: Tag[] = []

export function useTags() {
  const { data: tags, isLoading } = useSharedQuery(tagsQuery, NO_TAGS)
  return { tags, isLoading }
}

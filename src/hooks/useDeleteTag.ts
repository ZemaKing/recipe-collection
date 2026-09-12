import { useState } from 'react'
import { invalidateTagsCache } from '@/hooks/useTags'
import { supabase } from '@/lib/supabaseClient'

export function useDeleteTag() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteTag(tagId: string): Promise<void> {
    setIsDeleting(true)
    setError(null)
    try {
      const { error } = await supabase.from('tags').delete().eq('id', tagId)
      if (error) throw error
      invalidateTagsCache()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteTag, isDeleting, error }
}

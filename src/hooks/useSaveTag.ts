import { useState } from 'react'
import { invalidateTagsCache } from '@/hooks/useTags'
import { supabase } from '@/lib/supabaseClient'

export interface SaveTagInput {
  id?: string
  slug: string
  name_en: string
  name_sr: string | null
}

export function useSaveTag() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveTag({ id, ...fields }: SaveTagInput): Promise<void> {
    setIsSaving(true)
    setError(null)
    try {
      const { error } = id
        ? await supabase.from('tags').update(fields).eq('id', id)
        : await supabase.from('tags').insert(fields)
      if (error) throw error
      invalidateTagsCache()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { saveTag, isSaving, error }
}

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface SaveCategoryInput {
  id?: string
  slug: string
  name_en: string
  name_sr: string | null
}

export function useSaveCategory() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveCategory({ id, ...fields }: SaveCategoryInput): Promise<void> {
    setIsSaving(true)
    setError(null)
    try {
      const { error } = id
        ? await supabase.from('categories').update(fields).eq('id', id)
        : await supabase.from('categories').insert(fields)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { saveCategory, isSaving, error }
}

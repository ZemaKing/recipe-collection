import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface SaveNoteInput {
  id?: string
  title_en: string
  title_sr: string | null
  body_en: string | null
  body_sr: string | null
  recipe_id: string | null
}

export function useSaveNote() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveNote({ id, ...fields }: SaveNoteInput): Promise<void> {
    setIsSaving(true)
    setError(null)
    try {
      const { error } = id
        ? await supabase.from('kitchen_notes').update(fields).eq('id', id)
        : await supabase.from('kitchen_notes').insert(fields)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { saveNote, isSaving, error }
}

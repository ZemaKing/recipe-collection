import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useDeleteNote() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteNote(noteId: string): Promise<void> {
    setIsDeleting(true)
    setError(null)
    try {
      const { error } = await supabase.from('kitchen_notes').delete().eq('id', noteId)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteNote, isDeleting, error }
}

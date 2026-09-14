import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Unlike categories, recipes.subcategory_id is ON DELETE SET NULL, so
// deleting a subcategory in use never fails with a foreign-key violation —
// affected recipes simply lose their subcategory assignment.
export function useDeleteSubcategory() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteSubcategory(subcategoryId: string): Promise<void> {
    setIsDeleting(true)
    setError(null)
    try {
      const { error } = await supabase.from('subcategories').delete().eq('id', subcategoryId)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteSubcategory, isDeleting, error }
}

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteRecipeImageFolder } from '@/lib/storage'

export function useDeleteRecipe() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteRecipe(recipeId: string): Promise<void> {
    if (isDeleting) return
    setIsDeleting(true)
    setError(null)

    try {
      // Storage cleanup first: if it fails, the recipe row (and the DB cascade
      // it triggers) is left untouched, so the delete can simply be retried.
      await deleteRecipeImageFolder(recipeId)

      const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteRecipe, isDeleting, error }
}

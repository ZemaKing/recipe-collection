import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useDeleteIngredient() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteIngredient(ingredientId: string): Promise<void> {
    if (isDeleting) return
    setIsDeleting(true)
    setError(null)

    try {
      // recipe_ingredients.ingredient_id is `on delete set null`, so recipes
      // referencing this ingredient simply lose the catalog link (and drop
      // out of nutrition calculations) rather than blocking the delete.
      const { error } = await supabase.from('ingredients').delete().eq('id', ingredientId)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteIngredient, isDeleting, error }
}

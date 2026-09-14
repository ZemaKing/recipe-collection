import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { KitchenNote } from '@/types/kitchenNote'

export function useRecipeNotes(recipeId: string | null) {
  const [notes, setNotes] = useState<KitchenNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!recipeId) {
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('kitchen_notes')
        .select('id, title_en, title_sr, body_en, body_sr, is_pinned, created_at, recipe:recipes(id, slug, name_en, name_sr)')
        .eq('recipe_id', recipeId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (!error) {
        setNotes((data ?? []) as unknown as KitchenNote[])
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [recipeId])

  return { notes, isLoading }
}

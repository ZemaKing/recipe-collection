import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface SaveSubcategoryInput {
  id?: string
  category_id: string
  slug: string
  name_en: string
  name_sr: string | null
}

export function useSaveSubcategory() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveSubcategory({ id, ...fields }: SaveSubcategoryInput): Promise<void> {
    setIsSaving(true)
    setError(null)
    try {
      const { error } = id
        ? await supabase.from('subcategories').update(fields).eq('id', id)
        : await supabase.from('subcategories').insert(fields)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { saveSubcategory, isSaving, error }
}

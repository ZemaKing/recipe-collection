import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { MealSlot } from '@/lib/weekDates'

interface SaveMealPlanEntryInput {
  plan_date: string
  slot: MealSlot
  recipe_id: string
  note: string | null
}

export function useSaveMealPlanEntry() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveEntry(input: SaveMealPlanEntryInput): Promise<void> {
    setIsSaving(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('meal_plan_entries')
        .upsert(input, { onConflict: 'plan_date,slot' })
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteEntry(id: string): Promise<void> {
    setIsSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('meal_plan_entries').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { saveEntry, deleteEntry, isSaving, error }
}

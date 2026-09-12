import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { IngredientFormValues } from '@/lib/ingredientFormSchema'

export function useSaveIngredient() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(ingredientId: string | null, values: IngredientFormValues): Promise<string> {
    setIsSaving(true)
    setError(null)

    try {
      const micronutrients = Object.fromEntries(
        values.micronutrients.map((row) => [row.key, { amount: row.amount, unit: row.unit }]),
      )
      const unitConversions = Object.fromEntries(values.unitConversions.map((row) => [row.unit, row.grams]))

      const payload = {
        slug: values.slug,
        name_en: values.name_en,
        name_sr: values.name_sr ?? null,
        latin_name: values.latin_name ?? null,
        regional_names: values.regional_names ?? null,
        fact_en: values.fact_en ?? null,
        fact_sr: values.fact_sr ?? null,
        default_unit_en: values.default_unit_en ?? null,
        default_unit_sr: values.default_unit_sr ?? null,
        ingredient_category_id: values.ingredient_category_id || null,
        calories_kcal: values.calories_kcal ?? null,
        protein_g: values.protein_g ?? null,
        fat_g: values.fat_g ?? null,
        carbs_g: values.carbs_g ?? null,
        fiber_g: values.fiber_g ?? null,
        micronutrients,
        unit_conversions: unitConversions,
      }

      if (ingredientId) {
        const { error } = await supabase.from('ingredients').update(payload).eq('id', ingredientId)
        if (error) throw error
        return ingredientId
      }

      const { data, error } = await supabase.from('ingredients').insert(payload).select('id').single()
      if (error) throw error
      return data.id as string
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { save, isSaving, error }
}

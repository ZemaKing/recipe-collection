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
        unit_conversions: unitConversions,
      }

      let resolvedId: string

      if (ingredientId) {
        const { error } = await supabase.from('ingredients').update(payload).eq('id', ingredientId)
        if (error) throw error
        resolvedId = ingredientId
      } else {
        const { data, error } = await supabase.from('ingredients').insert(payload).select('id').single()
        if (error) throw error
        resolvedId = data.id as string
      }

      const { error: vitaminDeleteError } = await supabase
        .from('ingredient_vitamins')
        .delete()
        .eq('ingredient_id', resolvedId)
      if (vitaminDeleteError) throw vitaminDeleteError

      if (values.vitamins.length > 0) {
        const { error } = await supabase.from('ingredient_vitamins').insert(
          values.vitamins.map((row) => ({
            ingredient_id: resolvedId,
            vitamin_id: row.vitamin_id,
            amount_per_100g: row.amount,
          })),
        )
        if (error) throw error
      }

      const { error: mineralDeleteError } = await supabase
        .from('ingredient_minerals')
        .delete()
        .eq('ingredient_id', resolvedId)
      if (mineralDeleteError) throw mineralDeleteError

      if (values.minerals.length > 0) {
        const { error } = await supabase.from('ingredient_minerals').insert(
          values.minerals.map((row) => ({
            ingredient_id: resolvedId,
            mineral_id: row.mineral_id,
            amount_per_100g: row.amount,
          })),
        )
        if (error) throw error
      }

      return resolvedId
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

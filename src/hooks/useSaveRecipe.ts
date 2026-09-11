import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { RecipeFormValues } from '@/lib/recipeFormSchema'

export function useSaveRecipe() {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(recipeId: string | null, values: RecipeFormValues): Promise<string> {
    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        slug: values.slug,
        category_id: values.category_id,
        name_en: values.name_en,
        name_sr: values.name_sr ?? null,
        description_en: values.description_en ?? null,
        description_sr: values.description_sr ?? null,
        tips_en: values.tips_en ?? null,
        tips_sr: values.tips_sr ?? null,
        prep_time_minutes: values.prep_time_minutes ?? null,
        cook_time_minutes: values.cook_time_minutes ?? null,
        servings: values.servings ?? null,
        weight_grams: values.weight_grams ?? null,
        difficulty: values.difficulty ?? null,
        rating: values.rating,
      }

      let id = recipeId
      if (id) {
        const { error } = await supabase.from('recipes').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('recipes').insert(payload).select('id').single()
        if (error) throw error
        id = data.id
      }

      // Replace-all strategy for child rows — simple and safe for a
      // single-admin app; matches the pattern already used by seed.sql.
      await Promise.all([
        supabase.from('recipe_ingredients').delete().eq('recipe_id', id),
        supabase.from('recipe_steps').delete().eq('recipe_id', id),
        supabase.from('recipe_tags').delete().eq('recipe_id', id),
      ])

      if (values.ingredients.length > 0) {
        const { error } = await supabase.from('recipe_ingredients').insert(
          values.ingredients.map((ingredient, index) => ({
            recipe_id: id,
            order_index: index + 1,
            name_en: ingredient.name_en,
            name_sr: ingredient.name_sr ?? null,
            quantity: ingredient.quantity ?? null,
            unit_en: ingredient.unit_en ?? null,
            unit_sr: ingredient.unit_sr ?? null,
          })),
        )
        if (error) throw error
      }

      if (values.steps.length > 0) {
        const { error } = await supabase.from('recipe_steps').insert(
          values.steps.map((step, index) => ({
            recipe_id: id,
            step_number: index + 1,
            text_en: step.text_en,
            text_sr: step.text_sr ?? null,
          })),
        )
        if (error) throw error
      }

      if (values.tagIds.length > 0) {
        const { error } = await supabase
          .from('recipe_tags')
          .insert(values.tagIds.map((tagId) => ({ recipe_id: id, tag_id: tagId })))
        if (error) throw error
      }

      return id as string
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

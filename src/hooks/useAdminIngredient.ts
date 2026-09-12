import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { IngredientFormState, MicronutrientRow, UnitConversionRow } from '@/lib/ingredientFormState'

const ADMIN_INGREDIENT_SELECT = `
  id, slug, name_en, name_sr, latin_name, regional_names, fact_en, fact_sr,
  default_unit_en, default_unit_sr, ingredient_category_id,
  calories_kcal, protein_g, fat_g, carbs_g, fiber_g, micronutrients, unit_conversions
`

function toStr(value: number | null): string {
  return value === null || value === undefined ? '' : String(value)
}

export function useAdminIngredient(slug: string | undefined) {
  const [ingredient, setIngredient] = useState<(IngredientFormState & { id: string }) | null>(null)
  const [isLoading, setIsLoading] = useState(!!slug)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setNotFound(false)

      const { data, error } = await supabase
        .from('ingredients')
        .select(ADMIN_INGREDIENT_SELECT)
        .eq('slug', slug)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setError(error.message)
      } else if (!data) {
        setNotFound(true)
      } else {
        const micronutrients = data.micronutrients as Record<string, { amount: number; unit: string }>
        const unitConversions = data.unit_conversions as Record<string, number>

        setIngredient({
          id: data.id,
          slug: data.slug,
          name_en: data.name_en,
          name_sr: data.name_sr ?? '',
          latin_name: data.latin_name ?? '',
          regional_names: data.regional_names ?? '',
          fact_en: data.fact_en ?? '',
          fact_sr: data.fact_sr ?? '',
          default_unit_en: data.default_unit_en ?? '',
          default_unit_sr: data.default_unit_sr ?? '',
          ingredient_category_id: data.ingredient_category_id ?? '',
          calories_kcal: toStr(data.calories_kcal),
          protein_g: toStr(data.protein_g),
          fat_g: toStr(data.fat_g),
          carbs_g: toStr(data.carbs_g),
          fiber_g: toStr(data.fiber_g),
          micronutrients: Object.entries(micronutrients ?? {}).map(
            ([key, value]): MicronutrientRow => ({
              key,
              amount: toStr(value.amount),
              unit: value.unit,
            }),
          ),
          unitConversions: Object.entries(unitConversions ?? {}).map(
            ([unit, grams]): UnitConversionRow => ({ unit, grams: toStr(grams) }),
          ),
        })
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return { ingredient, isLoading, notFound, error }
}

import { useSharedQuery } from '@/hooks/useSharedQuery'
import { createSharedQuery } from '@/lib/sharedQuery'
import { supabase } from '@/lib/supabaseClient'
import type { Subcategory } from '@/types/recipe'

export interface SubcategoryWithCount extends Subcategory {
  recipeCount: number
}

interface SubcategoryRow extends Subcategory {
  recipes: { count: number }[]
}

const subcategoriesQuery = createSharedQuery(async (): Promise<SubcategoryWithCount[]> => {
  const { data, error } = await supabase
    .from('subcategories')
    .select('id, category_id, slug, name_en, name_sr, recipes(count)')
    .order('name_en')
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as SubcategoryRow[]
  return rows.map(({ recipes, ...rest }) => ({ ...rest, recipeCount: recipes?.[0]?.count ?? 0 }))
})

const NO_SUBCATEGORIES: SubcategoryWithCount[] = []

export function useSubcategories() {
  const {
    data: subcategories,
    isLoading,
    error,
  } = useSharedQuery(subcategoriesQuery, NO_SUBCATEGORIES)
  return { subcategories, isLoading, error }
}

import { useSharedQuery } from '@/hooks/useSharedQuery'
import { compareCategoryOrder } from '@/lib/categoryOrder'
import { createSharedQuery } from '@/lib/sharedQuery'
import { supabase } from '@/lib/supabaseClient'

export interface CategoryWithCount {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  recipeCount: number
}

// Shared: the sidebar and the browse page/recipe form ask on the same navigation.
const categoriesQuery = createSharedQuery(async (): Promise<CategoryWithCount[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name_en, name_sr, recipes(count)')
    .order('name_en')
  if (error) throw new Error(error.message)

  const mapped = (data ?? []).map((row) => {
    const recipes = row.recipes as unknown as { count: number }[]
    return {
      id: row.id,
      slug: row.slug,
      name_en: row.name_en,
      name_sr: row.name_sr,
      recipeCount: recipes?.[0]?.count ?? 0,
    }
  })
  mapped.sort((a, b) => compareCategoryOrder(a.slug, b.slug))
  return mapped
})

const NO_CATEGORIES: CategoryWithCount[] = []

export function useCategories() {
  const { data: categories, isLoading, error } = useSharedQuery(categoriesQuery, NO_CATEGORIES)
  return { categories, isLoading, error }
}

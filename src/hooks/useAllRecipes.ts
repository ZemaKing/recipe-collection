import { useSharedQuery } from '@/hooks/useSharedQuery'
import {
  mapRecipeSummaryRow,
  SEARCHABLE_RECIPE_SELECT,
  withPrimaryImageOnly,
  type RawImageRow,
} from '@/lib/recipeQueries'
import { createSharedQuery } from '@/lib/sharedQuery'
import { supabase } from '@/lib/supabaseClient'
import type { SearchableRecipe } from '@/types/recipe'

interface RawTagRow {
  tags: { slug: string } | null
}

// Shared by /recepti and recently added: going back to either shows the list
// at once while it refreshes.
const allRecipesQuery = createSharedQuery(async (): Promise<SearchableRecipe[]> => {
  const { data, error } = await withPrimaryImageOnly(
    supabase
      .from('recipes')
      .select(SEARCHABLE_RECIPE_SELECT)
      .order('created_at', { ascending: false }),
  )
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as (Omit<SearchableRecipe, 'image'> & {
    images: RawImageRow[]
    recipe_tags: RawTagRow[]
  })[]
  return rows.map(({ recipe_tags, ...row }) => ({
    ...mapRecipeSummaryRow(row),
    tagSlugs: recipe_tags
      .map((tagRow) => tagRow.tags?.slug)
      .filter((slug): slug is string => !!slug),
  }))
})

const NO_RECIPES: SearchableRecipe[] = []

export function useAllRecipes() {
  const { data: recipes, isLoading, error, update } = useSharedQuery(allRecipesQuery, NO_RECIPES)

  async function toggleFavorite(recipeId: string) {
    const current = recipes.find((recipe) => recipe.id === recipeId)
    if (!current) return
    const nextValue = !current.is_favorite

    update((prev) => prev.map((r) => (r.id === recipeId ? { ...r, is_favorite: nextValue } : r)))

    const { error } = await supabase
      .from('recipes')
      .update({ is_favorite: nextValue })
      .eq('id', recipeId)
    if (error) {
      update((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, is_favorite: current.is_favorite } : r)),
      )
    }
  }

  return { recipes, isLoading, error, toggleFavorite }
}

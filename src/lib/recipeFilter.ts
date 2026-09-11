import type { SearchableRecipe } from '@/types/recipe'

export type SortOption = 'rating' | 'time' | 'recent'

export interface RecipeFilterOptions {
  query?: string
  categorySlug?: string | null
  favoritesOnly?: boolean
  // A recipe must carry every selected tag (AND), not just one of them.
  tagSlugs?: string[]
  sort?: SortOption
}

function matchesQuery(recipe: SearchableRecipe, query: string): boolean {
  const nameMatch =
    recipe.name_en.toLowerCase().includes(query) ||
    (recipe.name_sr?.toLowerCase().includes(query) ?? false)
  if (nameMatch) return true

  return recipe.ingredients.some(
    (ingredient) =>
      ingredient.name_en.toLowerCase().includes(query) ||
      (ingredient.name_sr?.toLowerCase().includes(query) ?? false),
  )
}

export function filterAndSortRecipes<T extends SearchableRecipe>(
  recipes: T[],
  options: RecipeFilterOptions = {},
): T[] {
  const query = options.query?.trim().toLowerCase()
  const tagSlugs = options.tagSlugs ?? []

  const filtered = recipes.filter((recipe) => {
    if (options.categorySlug && recipe.category?.slug !== options.categorySlug) return false
    if (options.favoritesOnly && !recipe.is_favorite) return false
    if (tagSlugs.length > 0 && !tagSlugs.every((tag) => recipe.tagSlugs.includes(tag))) return false
    if (query && !matchesQuery(recipe, query)) return false
    return true
  })

  const sort = options.sort ?? 'recent'
  return [...filtered].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating
    if (sort === 'time') {
      const timeA = (a.prep_time_minutes ?? 0) + (a.cook_time_minutes ?? 0)
      const timeB = (b.prep_time_minutes ?? 0) + (b.cook_time_minutes ?? 0)
      return timeA - timeB
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

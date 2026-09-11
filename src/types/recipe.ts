export interface RecipeImageRef {
  storage_path: string
  alt_en: string | null
  alt_sr: string | null
}

export interface RecipeSummary {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  rating: number
  is_favorite: boolean
  category: { slug: string; name_en: string; name_sr: string | null } | null
  image: RecipeImageRef | null
}

// Superset used by the browse/search page: adds ingredient names (for search
// matching) and tag slugs (for quick-filter chips), plus created_at for the
// "recently added" sort.
export interface SearchableRecipe extends RecipeSummary {
  created_at: string
  ingredients: { name_en: string; name_sr: string | null }[]
  tagSlugs: string[]
}

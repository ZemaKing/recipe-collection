// Shared select fragment for any query returning RecipeSummary-shaped rows.
export const RECIPE_SUMMARY_SELECT =
  'id, slug, name_en, name_sr, prep_time_minutes, cook_time_minutes, rating, is_favorite, category:categories(slug, name_en, name_sr)'

// Superset used by the browse/search page: adds ingredient names (search
// matching), tag slugs (quick-filter chips), and created_at (recent sort).
export const SEARCHABLE_RECIPE_SELECT = `${RECIPE_SUMMARY_SELECT}, created_at, ingredients:recipe_ingredients(name_en, name_sr), recipe_tags(tags(slug))`

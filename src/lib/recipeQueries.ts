// Shared select fragment for any query returning RecipeSummary-shaped rows.
export const RECIPE_SUMMARY_SELECT =
  'id, slug, name_en, name_sr, prep_time_minutes, cook_time_minutes, rating, is_favorite, category:categories(slug, name_en, name_sr)'

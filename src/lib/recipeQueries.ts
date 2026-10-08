import type { RecipeImageRef, RecipeSummary } from '@/types/recipe'

// The recipe_images columns every list/detail query embeds (shape: RawImageRow).
export const RECIPE_IMAGE_COLUMNS = 'storage_path, thumb_path, width, height, alt_en, alt_sr, is_primary'

// Shared select fragment for any query returning RecipeSummary-shaped rows.
export const RECIPE_SUMMARY_SELECT = `id, slug, name_en, name_sr, prep_time_minutes, cook_time_minutes, rating, is_favorite, difficulty, category:categories(slug, name_en, name_sr), subcategory:subcategories(slug, name_en, name_sr), images:recipe_images(${RECIPE_IMAGE_COLUMNS})`

// Superset used by the browse/search page: adds ingredient names (search
// matching), tag slugs (quick-filter chips), and created_at (recent sort).
export const SEARCHABLE_RECIPE_SELECT = `${RECIPE_SUMMARY_SELECT}, created_at, ingredients:recipe_ingredients(name_en, name_sr), recipe_tags(tags(slug))`

export interface RawImageRow {
  storage_path: string
  thumb_path: string | null
  width: number | null
  height: number | null
  alt_en: string | null
  alt_sr: string | null
  is_primary: boolean
}

// Recipes can have multiple images (recipe_images); list views only need one.
export function pickPrimaryImage(images: RawImageRow[] | null | undefined): RecipeImageRef | null {
  if (!images || images.length === 0) return null
  const primary = images.find((image) => image.is_primary) ?? images[0]
  return {
    storage_path: primary.storage_path,
    thumb_path: primary.thumb_path ?? null,
    width: primary.width ?? null,
    height: primary.height ?? null,
    alt_en: primary.alt_en,
    alt_sr: primary.alt_sr,
  }
}

// Collapses a row fetched via RECIPE_SUMMARY_SELECT (or a superset of it,
// e.g. SEARCHABLE_RECIPE_SELECT) from a raw `images` array into a single
// primary `image`, preserving any other fields the caller's select added.
export function mapRecipeSummaryRow<T extends Omit<RecipeSummary, 'image'> & { images: RawImageRow[] }>(
  row: T,
): Omit<T, 'images'> & Pick<RecipeSummary, 'image'> {
  const { images, ...rest } = row
  return { ...rest, image: pickPrimaryImage(images) }
}

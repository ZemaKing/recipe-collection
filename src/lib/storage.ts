import { resizeImageVariants, type ResizeVariant } from '@/lib/image-resize'
import { supabase } from '@/lib/supabaseClient'
import type { RecipeImageRef } from '@/types/recipe'

const RECIPE_IMAGES_BUCKET = 'recipe-images'
const INGREDIENT_IMAGES_BUCKET = 'ingredient-images'

// Only the WebP output is stored (≈ 100–400 KB), so the input can be a big
// phone photo. Decoding a much larger file in the browser gets slow.
export const MAX_RECIPE_IMAGE_BYTES = 25 * 1024 * 1024
export const ACCEPTED_RECIPE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

// Same variants as the migration jobs (scripts/migrate-images/), WebP q85.
// The card thumb covers 500×500 because cards crop it to a square.
export const RECIPE_IMAGE_VARIANTS = [
  { name: 'full', maxWidth: 1600, quality: 0.85 },
  { name: 'card', maxWidth: 500, maxHeight: 500, fit: 'outside', quality: 0.85 },
] as const satisfies readonly ResizeVariant[]
export const INGREDIENT_IMAGE_VARIANT = {
  name: 'full',
  maxWidth: 600,
  maxHeight: 400,
  quality: 0.85,
} as const satisfies ResizeVariant

// New photo = new UUID path, so objects never change and can be cached for a year.
const CACHE_CONTROL = '31536000'

export type RecipeImageValidationError = 'invalidType' | 'tooLarge'

export function validateRecipeImageFile(file: File): RecipeImageValidationError | null {
  if (
    !ACCEPTED_RECIPE_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_RECIPE_IMAGE_TYPES)[number])
  ) {
    return 'invalidType'
  }
  if (file.size > MAX_RECIPE_IMAGE_BYTES) {
    return 'tooLarge'
  }
  return null
}

// Same size/type limits as recipe photos — kept as its own function (rather
// than sharing validateRecipeImageFile) so ingredient-specific error copy can
// diverge later without touching the recipe path.
export function validateIngredientImageFile(file: File): RecipeImageValidationError | null {
  if (
    !ACCEPTED_RECIPE_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_RECIPE_IMAGE_TYPES)[number])
  ) {
    return 'invalidType'
  }
  if (file.size > MAX_RECIPE_IMAGE_BYTES) {
    return 'tooLarge'
  }
  return null
}

export function getRecipeImageUrl(storagePath: string): string {
  return supabase.storage.from(RECIPE_IMAGES_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

// Cards and admin lists show the thumbnail; the detail hero shows the full
// image. Rows without a thumb fall back to storage_path.
export function getRecipeImageUrls(image: Pick<RecipeImageRef, 'storage_path' | 'thumb_path'>): {
  full: string
  thumb: string
} {
  const full = getRecipeImageUrl(image.storage_path)
  return { full, thumb: image.thumb_path ? getRecipeImageUrl(image.thumb_path) : full }
}

export function getIngredientImageUrl(storagePath: string): string {
  return supabase.storage.from(INGREDIENT_IMAGES_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

/** What an upload wrote: the columns to store on the row. */
export interface UploadedRecipeImage {
  storage_path: string
  thumb_path: string
  width: number
  height: number
}

export interface UploadedIngredientImage {
  storage_path: string
  width: number
  height: number
}

// Uploads the files in order; if one fails, removes the ones already uploaded
// (best effort) and rethrows, so a failed upload leaves nothing behind.
async function uploadAll(bucket: string, files: { path: string; blob: Blob }[]): Promise<void> {
  const done: string[] = []
  try {
    for (const { path, blob } of files) {
      const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        cacheControl: CACHE_CONTROL,
        contentType: blob.type,
        upsert: false,
      })
      if (error) throw error
      done.push(path)
    }
  } catch (error) {
    if (done.length) await removeFiles(bucket, done).catch(() => undefined)
    throw error
  }
}

async function removeFiles(bucket: string, paths: (string | null | undefined)[]): Promise<void> {
  const unique = [...new Set(paths.filter((p): p is string => !!p))]
  if (!unique.length) return
  const { error } = await supabase.storage.from(bucket).remove(unique)
  if (error) throw error
}

// Every input becomes WebP (PNG where the browser can't encode WebP): a full
// image (≤ 1600 px) and a card thumb ({uuid}.card.webp, short edge 500).
export async function uploadRecipeImage(
  recipeId: string,
  file: File,
): Promise<UploadedRecipeImage> {
  const [full, card] = await resizeImageVariants(file, [...RECIPE_IMAGE_VARIANTS])
  const id = crypto.randomUUID()
  const storagePath = `${recipeId}/${id}.${full.ext}`
  const thumbPath = `${recipeId}/${id}.card.${card.ext}`
  await uploadAll(RECIPE_IMAGES_BUCKET, [
    { path: storagePath, blob: full.blob },
    { path: thumbPath, blob: card.blob },
  ])
  return {
    storage_path: storagePath,
    thumb_path: thumbPath,
    width: full.width,
    height: full.height,
  }
}

/** Removes every file of a recipe photo (full, thumb, pre-WebP original). */
export async function deleteRecipeImageFiles(paths: (string | null | undefined)[]): Promise<void> {
  await removeFiles(RECIPE_IMAGES_BUCKET, paths)
}

export async function uploadIngredientImage(
  ingredientId: string,
  file: File,
): Promise<UploadedIngredientImage> {
  const [image] = await resizeImageVariants(file, [INGREDIENT_IMAGE_VARIANT])
  const storagePath = `${ingredientId}/${crypto.randomUUID()}.${image.ext}`
  await uploadAll(INGREDIENT_IMAGES_BUCKET, [{ path: storagePath, blob: image.blob }])
  return { storage_path: storagePath, width: image.width, height: image.height }
}

/** Removes an ingredient photo's files (the image and its pre-WebP original). */
export async function deleteIngredientImageFiles(
  paths: (string | null | undefined)[],
): Promise<void> {
  await removeFiles(INGREDIENT_IMAGES_BUCKET, paths)
}

// Same folder-listing cleanup as deleteRecipeImageFolder, used when the whole
// ingredient row is deleted rather than just its photo replaced/removed.
export async function deleteIngredientImageFolder(ingredientId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from(INGREDIENT_IMAGES_BUCKET)
    .list(ingredientId)
  if (listError) throw listError
  if (!files || files.length === 0) return

  const paths = files.map((file) => `${ingredientId}/${file.name}`)
  const { error } = await supabase.storage.from(INGREDIENT_IMAGES_BUCKET).remove(paths)
  if (error) throw error
}

// Removes every object under a recipe's image folder (uploadRecipeImage keys
// objects by `${recipeId}/...`). Lists directly from Storage rather than the
// recipe_images table so it also cleans up files left behind by a failed
// upload that never got a DB row.
export async function deleteRecipeImageFolder(recipeId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from(RECIPE_IMAGES_BUCKET)
    .list(recipeId)
  if (listError) throw listError
  if (!files || files.length === 0) return

  const paths = files.map((file) => `${recipeId}/${file.name}`)
  const { error } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove(paths)
  if (error) throw error
}

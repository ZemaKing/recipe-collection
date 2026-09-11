import { supabase } from '@/lib/supabaseClient'

const RECIPE_IMAGES_BUCKET = 'recipe-images'

export const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_RECIPE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type RecipeImageValidationError = 'invalidType' | 'tooLarge'

export function validateRecipeImageFile(file: File): RecipeImageValidationError | null {
  if (!ACCEPTED_RECIPE_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_RECIPE_IMAGE_TYPES)[number])) {
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

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  return file.type.split('/').pop() ?? 'jpg'
}

const MAX_RECIPE_IMAGE_DIMENSION = 2000

// Downscales oversized photos client-side before they ever hit Storage —
// phone camera photos routinely exceed 4000px on a side, which is wasted
// bandwidth for a recipe thumbnail/hero image. Small images pass through
// untouched (re-encoding a PNG through canvas can bloat it).
async function resizeImageIfNeeded(file: File): Promise<File> {
  if (file.type === 'image/png') return file

  const bitmap = await createImageBitmap(file)
  const largestSide = Math.max(bitmap.width, bitmap.height)
  if (largestSide <= MAX_RECIPE_IMAGE_DIMENSION) {
    bitmap.close()
    return file
  }

  const scale = MAX_RECIPE_IMAGE_DIMENSION / largestSide
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.85))
  if (!blob) return file

  return new File([blob], file.name, { type: file.type })
}

export async function uploadRecipeImage(recipeId: string, file: File): Promise<string> {
  const resized = await resizeImageIfNeeded(file)
  const storagePath = `${recipeId}/${crypto.randomUUID()}.${extensionFor(resized)}`
  const { error } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).upload(storagePath, resized, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  return storagePath
}

export async function deleteRecipeImageFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([storagePath])
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

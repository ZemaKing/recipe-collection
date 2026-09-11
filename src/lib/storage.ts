import { supabase } from '@/lib/supabaseClient'

const RECIPE_IMAGES_BUCKET = 'recipe-images'

export function getRecipeImageUrl(storagePath: string): string {
  return supabase.storage.from(RECIPE_IMAGES_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

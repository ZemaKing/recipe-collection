import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteIngredientImageFiles, uploadIngredientImage } from '@/lib/storage'

export interface IngredientImageState {
  storagePath: string | null
  // The pre-WebP file of a migrated photo (until Phase 39 retires it).
  originalPath: string | null
  altEn: string
  altSr: string
}

const IMAGE_SELECT = 'image_storage_path, image_original_path, image_alt_en, image_alt_sr'

const EMPTY_STATE: IngredientImageState = {
  storagePath: null,
  originalPath: null,
  altEn: '',
  altSr: '',
}

function mapRow(row: {
  image_storage_path: string | null
  image_original_path: string | null
  image_alt_en: string | null
  image_alt_sr: string | null
}): IngredientImageState {
  return {
    storagePath: row.image_storage_path,
    originalPath: row.image_original_path,
    altEn: row.image_alt_en ?? '',
    altSr: row.image_alt_sr ?? '',
  }
}

// Mirrors useRecipeImages (self-fetching, keyed by the owning entity's id) but
// for a single image column pair on the ingredients row itself rather than a
// separate gallery table — ingredients only ever have one photo.
export function useIngredientImage(ingredientId: string | null) {
  const [image, setImage] = useState<IngredientImageState>(EMPTY_STATE)
  const [isLoading, setIsLoading] = useState(!!ingredientId)
  const [error, setError] = useState<string | null>(null)
  const imageRef = useRef(image)

  useEffect(() => {
    imageRef.current = image
  }, [image])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!ingredientId) {
        setImage(EMPTY_STATE)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const { data, error } = await supabase
        .from('ingredients')
        .select(IMAGE_SELECT)
        .eq('id', ingredientId)
        .single()

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        setImage(mapRow(data))
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [ingredientId])

  async function setImageFile(file: File) {
    if (!ingredientId) throw new Error('Ingredient must be saved before adding an image')

    const previous = imageRef.current
    const uploaded = await uploadIngredientImage(ingredientId, file)

    // The previous photo is discarded entirely, including a migrated photo's
    // pre-WebP original (it's in the Phase 34 backup).
    const { error } = await supabase
      .from('ingredients')
      .update({
        image_storage_path: uploaded.storage_path,
        image_width: uploaded.width,
        image_height: uploaded.height,
        image_original_path: null,
      })
      .eq('id', ingredientId)
    if (error) {
      await deleteIngredientImageFiles([uploaded.storage_path]).catch(() => undefined)
      throw error
    }

    await deleteIngredientImageFiles([previous.storagePath, previous.originalPath]).catch(
      () => undefined,
    )

    setImage((prev) => ({ ...prev, storagePath: uploaded.storage_path, originalPath: null }))
  }

  async function removeImage() {
    if (!ingredientId) return
    const current = imageRef.current
    if (!current.storagePath) return

    const { error } = await supabase
      .from('ingredients')
      .update({
        image_storage_path: null,
        image_width: null,
        image_height: null,
        image_original_path: null,
        image_alt_en: null,
        image_alt_sr: null,
      })
      .eq('id', ingredientId)
    if (error) throw error

    await deleteIngredientImageFiles([current.storagePath, current.originalPath]).catch(
      () => undefined,
    )
    setImage(EMPTY_STATE)
  }

  async function updateAlt(altEn: string, altSr: string) {
    if (!ingredientId) return
    const { error } = await supabase
      .from('ingredients')
      .update({ image_alt_en: altEn || null, image_alt_sr: altSr || null })
      .eq('id', ingredientId)
    if (error) throw error

    setImage((prev) => ({ ...prev, altEn, altSr }))
  }

  return { image, isLoading, error, setImageFile, removeImage, updateAlt }
}

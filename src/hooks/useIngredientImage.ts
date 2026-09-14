import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteIngredientImageFile, uploadIngredientImage } from '@/lib/storage'

export interface IngredientImageState {
  storagePath: string | null
  altEn: string
  altSr: string
}

const IMAGE_SELECT = 'image_storage_path, image_alt_en, image_alt_sr'

const EMPTY_STATE: IngredientImageState = { storagePath: null, altEn: '', altSr: '' }

function mapRow(row: { image_storage_path: string | null; image_alt_en: string | null; image_alt_sr: string | null }): IngredientImageState {
  return {
    storagePath: row.image_storage_path,
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
      const { data, error } = await supabase.from('ingredients').select(IMAGE_SELECT).eq('id', ingredientId).single()

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

    const previousPath = imageRef.current.storagePath
    const storagePath = await uploadIngredientImage(ingredientId, file)

    const { error } = await supabase.from('ingredients').update({ image_storage_path: storagePath }).eq('id', ingredientId)
    if (error) {
      await deleteIngredientImageFile(storagePath).catch(() => undefined)
      throw error
    }

    if (previousPath) {
      await deleteIngredientImageFile(previousPath).catch(() => undefined)
    }

    setImage((prev) => ({ ...prev, storagePath }))
  }

  async function removeImage() {
    if (!ingredientId) return
    const currentPath = imageRef.current.storagePath
    if (!currentPath) return

    const { error } = await supabase
      .from('ingredients')
      .update({ image_storage_path: null, image_alt_en: null, image_alt_sr: null })
      .eq('id', ingredientId)
    if (error) throw error

    await deleteIngredientImageFile(currentPath).catch(() => undefined)
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

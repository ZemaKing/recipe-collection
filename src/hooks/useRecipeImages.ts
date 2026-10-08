import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteRecipeImageFiles, uploadRecipeImage } from '@/lib/storage'

export interface AdminRecipeImage {
  id: string
  storage_path: string
  thumb_path: string | null
  // The pre-WebP file of a migrated photo (until Phase 39 retires it).
  original_path: string | null
  alt_en: string
  alt_sr: string
  is_primary: boolean
  order_index: number
}

const IMAGE_SELECT =
  'id, storage_path, thumb_path, original_path, alt_en, alt_sr, is_primary, order_index'

// Every file that belongs to a photo, for deleting it.
function filesOf(image: Pick<AdminRecipeImage, 'storage_path' | 'thumb_path' | 'original_path'>) {
  return [image.storage_path, image.thumb_path, image.original_path]
}

function fetchImages(recipeId: string) {
  return supabase
    .from('recipe_images')
    .select(IMAGE_SELECT)
    .eq('recipe_id', recipeId)
    .order('order_index', { ascending: true })
}

function mapRow(row: {
  id: string
  storage_path: string
  thumb_path: string | null
  original_path: string | null
  alt_en: string | null
  alt_sr: string | null
  is_primary: boolean
  order_index: number
}): AdminRecipeImage {
  return {
    id: row.id,
    storage_path: row.storage_path,
    thumb_path: row.thumb_path,
    original_path: row.original_path,
    alt_en: row.alt_en ?? '',
    alt_sr: row.alt_sr ?? '',
    is_primary: row.is_primary,
    order_index: row.order_index,
  }
}

export function useRecipeImages(recipeId: string | null) {
  const [images, setImages] = useState<AdminRecipeImage[]>([])
  const [isLoading, setIsLoading] = useState(!!recipeId)
  const [error, setError] = useState<string | null>(null)

  // Mirrors `images` synchronously so sequential mutations (e.g. uploading
  // several files in a row) read the latest list instead of a stale closure
  // from the render that was current when the mutation function was handed out.
  const imagesRef = useRef<AdminRecipeImage[]>([])

  function applyImages(
    next: AdminRecipeImage[] | ((prev: AdminRecipeImage[]) => AdminRecipeImage[]),
  ) {
    imagesRef.current = typeof next === 'function' ? next(imagesRef.current) : next
    setImages(imagesRef.current)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!recipeId) {
        applyImages([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const { data, error } = await fetchImages(recipeId)

      if (cancelled) return

      if (error) {
        setError(error.message)
      } else {
        applyImages(data.map(mapRow))
        setError(null)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [recipeId])

  async function reload() {
    if (!recipeId) {
      applyImages([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const { data, error } = await fetchImages(recipeId)

    if (error) {
      setError(error.message)
    } else {
      applyImages(data.map(mapRow))
      setError(null)
    }
    setIsLoading(false)
  }

  async function addImage(file: File, altEn: string, altSr: string) {
    if (!recipeId) throw new Error('Recipe must be saved before adding images')

    const current = imagesRef.current
    const uploaded = await uploadRecipeImage(recipeId, file)
    const nextOrder = current.reduce((max, img) => Math.max(max, img.order_index), 0) + 1

    const { data, error } = await supabase
      .from('recipe_images')
      .insert({
        recipe_id: recipeId,
        ...uploaded,
        alt_en: altEn || null,
        alt_sr: altSr || null,
        is_primary: current.length === 0,
        order_index: nextOrder,
      })
      .select(IMAGE_SELECT)
      .single()

    if (error) {
      await deleteRecipeImageFiles(filesOf({ ...uploaded, original_path: null })).catch(
        () => undefined,
      )
      throw error
    }

    applyImages((prev) => [...prev, mapRow(data)])
  }

  async function replaceImage(image: AdminRecipeImage, file: File) {
    if (!recipeId) throw new Error('Recipe must be saved before replacing images')

    const uploaded = await uploadRecipeImage(recipeId, file)
    // The old photo is discarded entirely, including a migrated photo's
    // pre-WebP original (it's in the Phase 34 backup).
    const replaced = { ...uploaded, original_path: null }

    const { error } = await supabase.from('recipe_images').update(replaced).eq('id', image.id)

    if (error) {
      await deleteRecipeImageFiles(filesOf(replaced)).catch(() => undefined)
      throw error
    }

    // Old files are now unreferenced — best-effort cleanup, doesn't affect the
    // row we just successfully updated.
    await deleteRecipeImageFiles(filesOf(image)).catch(() => undefined)

    applyImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, ...replaced } : img)))
  }

  async function removeImage(image: AdminRecipeImage) {
    // Row first: if that fails the photo is still intact. Then its files,
    // best effort (a leftover file is harmless; a row without files isn't).
    const { error } = await supabase.from('recipe_images').delete().eq('id', image.id)
    if (error) throw error
    await deleteRecipeImageFiles(filesOf(image)).catch(() => undefined)

    const remaining = imagesRef.current.filter((img) => img.id !== image.id)

    if (image.is_primary && remaining.length > 0) {
      const promoted = remaining.reduce((first, img) =>
        img.order_index < first.order_index ? img : first,
      )
      const { error: promoteError } = await supabase
        .from('recipe_images')
        .update({ is_primary: true })
        .eq('id', promoted.id)
      if (promoteError) throw promoteError
      applyImages(
        remaining.map((img) => (img.id === promoted.id ? { ...img, is_primary: true } : img)),
      )
      return
    }

    applyImages(remaining)
  }

  async function setPrimary(imageId: string) {
    const currentPrimary = imagesRef.current.find((img) => img.is_primary)
    if (currentPrimary?.id === imageId) return

    if (currentPrimary) {
      const { error } = await supabase
        .from('recipe_images')
        .update({ is_primary: false })
        .eq('id', currentPrimary.id)
      if (error) throw error
    }

    const { error } = await supabase
      .from('recipe_images')
      .update({ is_primary: true })
      .eq('id', imageId)
    if (error) throw error

    applyImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === imageId })))
  }

  async function updateAlt(imageId: string, altEn: string, altSr: string) {
    const { error } = await supabase
      .from('recipe_images')
      .update({ alt_en: altEn || null, alt_sr: altSr || null })
      .eq('id', imageId)
    if (error) throw error

    applyImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, alt_en: altEn, alt_sr: altSr } : img)),
    )
  }

  async function moveImage(imageId: string, direction: -1 | 1) {
    const sorted = [...imagesRef.current].sort((a, b) => a.order_index - b.order_index)
    const index = sorted.findIndex((img) => img.id === imageId)
    const targetIndex = index + direction
    if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) return

    const current = sorted[index]
    const target = sorted[targetIndex]

    const [{ error: err1 }, { error: err2 }] = await Promise.all([
      supabase
        .from('recipe_images')
        .update({ order_index: target.order_index })
        .eq('id', current.id),
      supabase
        .from('recipe_images')
        .update({ order_index: current.order_index })
        .eq('id', target.id),
    ])
    if (err1) throw err1
    if (err2) throw err2

    applyImages((prev) =>
      prev.map((img) => {
        if (img.id === current.id) return { ...img, order_index: target.order_index }
        if (img.id === target.id) return { ...img, order_index: current.order_index }
        return img
      }),
    )
  }

  return {
    images,
    isLoading,
    error,
    reload,
    addImage,
    replaceImage,
    removeImage,
    setPrimary,
    updateAlt,
    moveImage,
  }
}

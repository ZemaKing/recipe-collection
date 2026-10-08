import { beforeEach, describe, expect, it, vi } from 'vitest'

// A fake Storage that records calls; `failOn` makes the upload of a matching path fail.
const storage = vi.hoisted(() => ({
  calls: [] as string[],
  options: [] as Record<string, unknown>[],
  failOn: null as RegExp | null,
}))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _blob: Blob, options: Record<string, unknown>) => {
          storage.calls.push(`upload ${bucket}/${path}`)
          storage.options.push(options)
          return { error: storage.failOn?.test(path) ? new Error(`upload ${path} failed`) : null }
        },
        remove: async (paths: string[]) => {
          storage.calls.push(`remove ${bucket}/${paths.join(',')}`)
          return { error: null }
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.test/${bucket}/${path}` },
        }),
      }),
    },
  },
}))

// jsdom has no canvas; the resizer itself is tested in image-resize.test.ts.
vi.mock('@/lib/image-resize', () => ({
  resizeImageVariants: vi.fn(async (_file: Blob, variants: { name: string }[]) =>
    variants.map((v) => ({
      name: v.name,
      blob: new Blob(['x'], { type: 'image/webp' }),
      width: v.name === 'card' ? 750 : 1536,
      height: v.name === 'card' ? 500 : 1024,
      type: 'image/webp',
      ext: 'webp',
    })),
  ),
}))

import { resizeImageVariants } from '@/lib/image-resize'
import {
  deleteRecipeImageFiles,
  INGREDIENT_IMAGE_VARIANT,
  RECIPE_IMAGE_VARIANTS,
  uploadIngredientImage,
  uploadRecipeImage,
} from './storage'

const file = new File(['png'], 'dish.png', { type: 'image/png' })

beforeEach(() => {
  storage.calls = []
  storage.options = []
  storage.failOn = null
})

describe('uploadRecipeImage', () => {
  it('resizes to full + card WebP (q85) and uploads both under one new UUID', async () => {
    const uploaded = await uploadRecipeImage('r1', file)

    expect(resizeImageVariants).toHaveBeenCalledWith(file, [...RECIPE_IMAGE_VARIANTS])
    expect(RECIPE_IMAGE_VARIANTS.map((v) => v.quality)).toEqual([0.85, 0.85])
    const id = /^r1\/(.+)\.webp$/.exec(uploaded.storage_path)?.[1]
    expect(uploaded).toEqual({
      storage_path: `r1/${id}.webp`,
      thumb_path: `r1/${id}.card.webp`,
      width: 1536,
      height: 1024,
    })
    expect(storage.calls).toEqual([
      `upload recipe-images/r1/${id}.webp`,
      `upload recipe-images/r1/${id}.card.webp`,
    ])
    expect(storage.options[0]).toMatchObject({
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: false,
    })
  })

  it('removes the full image when the card upload fails, and rethrows', async () => {
    storage.failOn = /\.card\.webp$/
    await expect(uploadRecipeImage('r1', file)).rejects.toThrow('failed')
    expect(storage.calls).toHaveLength(3)
    const full = storage.calls[0].replace('upload ', '')
    expect(storage.calls[2]).toBe(`remove ${full}`)
  })

  it('uploads nothing more after the first upload fails', async () => {
    storage.failOn = /\.webp$/
    await expect(uploadRecipeImage('r1', file)).rejects.toThrow('failed')
    expect(storage.calls).toHaveLength(1)
  })
})

describe('uploadIngredientImage', () => {
  it('uploads one variant fitted inside 600×400 at q85', async () => {
    const uploaded = await uploadIngredientImage('i1', file)
    expect(resizeImageVariants).toHaveBeenCalledWith(file, [INGREDIENT_IMAGE_VARIANT])
    expect(INGREDIENT_IMAGE_VARIANT).toMatchObject({ maxWidth: 600, maxHeight: 400, quality: 0.85 })
    expect(uploaded.storage_path).toMatch(/^i1\/[^/]+\.webp$/)
    expect(storage.calls).toEqual([`upload ingredient-images/${uploaded.storage_path}`])
  })
})

describe('deleteRecipeImageFiles', () => {
  it('removes every file of a photo in one call, skipping empty and duplicate paths', async () => {
    await deleteRecipeImageFiles(['r1/a.webp', null, 'r1/a.card.webp', 'r1/a.webp', 'r1/a.png'])
    expect(storage.calls).toEqual(['remove recipe-images/r1/a.webp,r1/a.card.webp,r1/a.png'])
  })

  it('does nothing without paths', async () => {
    await deleteRecipeImageFiles([null, undefined])
    expect(storage.calls).toEqual([])
  })
})

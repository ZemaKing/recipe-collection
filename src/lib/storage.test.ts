import { describe, expect, it } from 'vitest'
import {
  ACCEPTED_RECIPE_IMAGE_TYPES,
  getRecipeImageUrls,
  MAX_RECIPE_IMAGE_BYTES,
  validateRecipeImageFile,
} from './storage'

function makeFile(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], 'photo', { type })
}

describe('validateRecipeImageFile', () => {
  it('accepts jpeg/png/webp within the size limit', () => {
    for (const type of ACCEPTED_RECIPE_IMAGE_TYPES) {
      expect(validateRecipeImageFile(makeFile(type, 1024))).toBeNull()
    }
  })

  it('rejects unsupported mime types', () => {
    expect(validateRecipeImageFile(makeFile('image/gif', 1024))).toBe('invalidType')
    expect(validateRecipeImageFile(makeFile('application/pdf', 1024))).toBe('invalidType')
  })

  it('rejects files over the size limit', () => {
    expect(validateRecipeImageFile(makeFile('image/jpeg', MAX_RECIPE_IMAGE_BYTES + 1))).toBe(
      'tooLarge',
    )
  })

  it('accepts a file exactly at the size limit', () => {
    expect(validateRecipeImageFile(makeFile('image/jpeg', MAX_RECIPE_IMAGE_BYTES))).toBeNull()
  })
})

describe('getRecipeImageUrls', () => {
  it('uses the thumbnail for lists and storage_path for the full image', () => {
    const urls = getRecipeImageUrls({ storage_path: 'r1/a.webp', thumb_path: 'r1/a.thumb.webp' })
    expect(urls.full).toMatch(/\/recipe-images\/r1\/a\.webp$/)
    expect(urls.thumb).toMatch(/\/recipe-images\/r1\/a\.thumb\.webp$/)
  })

  it('falls back to storage_path when there is no thumbnail', () => {
    const urls = getRecipeImageUrls({ storage_path: 'r1/a.png', thumb_path: null })
    expect(urls.thumb).toBe(urls.full)
    expect(urls.full).toMatch(/\/recipe-images\/r1\/a\.png$/)
  })
})

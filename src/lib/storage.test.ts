import { describe, expect, it } from 'vitest'
import { ACCEPTED_RECIPE_IMAGE_TYPES, MAX_RECIPE_IMAGE_BYTES, validateRecipeImageFile } from './storage'

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
    expect(validateRecipeImageFile(makeFile('image/jpeg', MAX_RECIPE_IMAGE_BYTES + 1))).toBe('tooLarge')
  })

  it('accepts a file exactly at the size limit', () => {
    expect(validateRecipeImageFile(makeFile('image/jpeg', MAX_RECIPE_IMAGE_BYTES))).toBeNull()
  })
})

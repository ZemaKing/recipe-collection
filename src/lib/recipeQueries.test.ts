import { describe, expect, it } from 'vitest'
import { PostgrestClient } from '@supabase/postgrest-js'
import {
  mapRecipeSummaryRow,
  pickPrimaryImage,
  RECIPE_SUMMARY_SELECT,
  withPrimaryImageOnly,
  type RawImageRow,
} from './recipeQueries'

const image = (overrides: Partial<RawImageRow>): RawImageRow => ({
  storage_path: 'r/a.png',
  thumb_path: null,
  width: null,
  height: null,
  alt_en: null,
  alt_sr: null,
  is_primary: false,
  ...overrides,
})

describe('pickPrimaryImage', () => {
  it('returns null without images', () => {
    expect(pickPrimaryImage([])).toBeNull()
    expect(pickPrimaryImage(null)).toBeNull()
  })

  it('prefers the primary image and carries the variant columns', () => {
    const picked = pickPrimaryImage([
      image({ storage_path: 'r/first.png' }),
      image({
        storage_path: 'r/b.webp',
        thumb_path: 'r/b.thumb.webp',
        width: 1536,
        height: 1024,
        alt_en: 'Soup',
        is_primary: true,
      }),
    ])
    expect(picked).toEqual({
      storage_path: 'r/b.webp',
      thumb_path: 'r/b.thumb.webp',
      width: 1536,
      height: 1024,
      alt_en: 'Soup',
      alt_sr: null,
    })
  })

  it('falls back to the first image, with null variants when not migrated yet', () => {
    expect(pickPrimaryImage([image({ storage_path: 'r/first.png' })])).toMatchObject({
      storage_path: 'r/first.png',
      thumb_path: null,
      width: null,
      height: null,
    })
  })
})

describe('mapRecipeSummaryRow', () => {
  it('replaces the images array with the primary image', () => {
    const row = {
      id: '1',
      slug: 's',
      name_en: 'n',
      name_sr: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      rating: 0,
      is_favorite: false,
      difficulty: null,
      category: null,
      subcategory: null,
      images: [image({ is_primary: true, thumb_path: 'r/a.thumb.webp' })],
    }
    const mapped = mapRecipeSummaryRow(row)
    expect(mapped).not.toHaveProperty('images')
    expect(mapped.image?.thumb_path).toBe('r/a.thumb.webp')
  })
})

describe('withPrimaryImageOnly', () => {
  it('orders the embedded images primary-first, then by order_index, and keeps one', () => {
    const query = withPrimaryImageOnly(
      new PostgrestClient('http://localhost/rest/v1').from('recipes').select(RECIPE_SUMMARY_SELECT),
    ).order('created_at', { ascending: false })
    const params = (query as unknown as { url: URL }).url.searchParams

    expect(params.get('images.order')).toBe('is_primary.desc,order_index.asc')
    expect(params.get('images.limit')).toBe('1')
    // The main table's own order is untouched.
    expect(params.get('order')).toBe('created_at.desc')
  })
})

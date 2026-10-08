import { describe, expect, it } from 'vitest'

import type { Manifest, ManifestEntry } from '../images/manifest.ts'
import { planFlip } from './flip-plan.ts'

const entry = (source: string, variant: string, width: number, height: number): ManifestEntry => ({
  source,
  sourceUrl: `https://cdn.test/${source}`,
  sourceSha256: 'x',
  sourceBytes: 1,
  sourceWidth: 1536,
  sourceHeight: 1024,
  variant,
  settings: '',
  contentType: 'image/webp',
  sha256: 'y',
  bytes: 1,
  width,
  height,
  uploadedAt: '',
})

const manifest: Manifest = {
  job: 'recipe photos',
  bucket: 'recipe-images',
  objects: {
    'r1/a.webp': entry('r1/a.png', 'full', 1536, 1024),
    'r1/a.thumb.webp': entry('r1/a.png', 'thumb', 500, 333),
    'r2/b.webp': entry('r2/b.jpg', 'full', 1200, 800),
    'r2/b.thumb.webp': entry('r2/b.jpg', 'thumb', 500, 333),
  },
}
const variants = { full: 'full', thumb: 'thumb' }

describe('planFlip apply', () => {
  it('points each row at its full + thumb and keeps the original', () => {
    const plan = planFlip(
      [{ id: '1', path: 'r1/a.png', original: null }],
      manifest,
      'apply',
      variants,
    )
    expect(plan.problems).toEqual([])
    expect(plan.entries).toEqual([
      {
        id: '1',
        from_path: 'r1/a.png',
        to_path: 'r1/a.webp',
        original_path: 'r1/a.png',
        thumb_path: 'r1/a.thumb.webp',
        width: 1536,
        height: 1024,
      },
    ])
  })

  it('skips rows already flipped and photo-less rows', () => {
    const plan = planFlip(
      [
        { id: '1', path: 'r1/a.webp', original: 'r1/a.png', thumb: 'r1/a.thumb.webp' },
        { id: '2', path: null, original: null },
      ],
      manifest,
      'apply',
      variants,
    )
    expect(plan).toEqual({ entries: [], done: ['1'], problems: [] })
  })

  it('swaps only the thumb of a flipped row when the job has a new thumb variant', () => {
    const withCard: Manifest = {
      ...manifest,
      objects: { ...manifest.objects, 'r1/a.card.webp': entry('r1/a.png', 'card', 750, 500) },
    }
    const plan = planFlip(
      [{ id: '1', path: 'r1/a.webp', original: 'r1/a.png', thumb: 'r1/a.thumb.webp' }],
      withCard,
      'apply',
      { full: 'full', thumb: 'card' },
    )
    expect(plan.problems).toEqual([])
    expect(plan.entries).toEqual([
      {
        id: '1',
        from_path: 'r1/a.webp',
        to_path: 'r1/a.webp',
        original_path: 'r1/a.png',
        thumb_path: 'r1/a.card.webp',
        width: 1536,
        height: 1024,
      },
    ])
  })

  it('reports rows without uploads, or a missing thumb', () => {
    const noThumb: Manifest = {
      ...manifest,
      objects: { 'r1/a.webp': manifest.objects['r1/a.webp'] },
    }
    const plan = planFlip(
      [
        { id: '1', path: 'r1/a.png', original: null },
        { id: '3', path: 'r3/c.png', original: null },
      ],
      noThumb,
      'apply',
      variants,
    )
    expect(plan.entries).toEqual([])
    expect(plan.problems).toHaveLength(2)
  })

  it('a single-variant job sends no thumb_path', () => {
    const plan = planFlip([{ id: '2', path: 'r2/b.jpg', original: null }], manifest, 'apply', {
      full: 'full',
    })
    expect(plan.entries[0]).not.toHaveProperty('thumb_path')
    expect(plan.entries[0]).toMatchObject({ to_path: 'r2/b.webp', width: 1200, height: 800 })
  })
})

describe('planFlip rollback', () => {
  it('points flipped rows back at the original and clears the variant columns', () => {
    const plan = planFlip(
      [
        { id: '1', path: 'r1/a.webp', original: 'r1/a.png' },
        { id: '2', path: 'r2/b.jpg', original: null },
      ],
      manifest,
      'rollback',
      variants,
    )
    expect(plan.done).toEqual(['2'])
    expect(plan.entries).toEqual([
      {
        id: '1',
        from_path: 'r1/a.webp',
        to_path: 'r1/a.png',
        original_path: null,
        thumb_path: null,
        width: null,
        height: null,
      },
    ])
  })

  it('refuses a row that points somewhere unexpected', () => {
    const plan = planFlip(
      [{ id: '1', path: 'r1/other.webp', original: 'r1/a.png' }],
      manifest,
      'rollback',
      variants,
    )
    expect(plan.entries).toEqual([])
    expect(plan.problems[0]).toContain('r1/other.webp')
  })
})

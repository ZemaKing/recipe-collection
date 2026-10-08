import { describe, expect, it } from 'vitest'

import type { Manifest, ManifestEntry } from '../images/manifest.ts'
import { planPrune } from './prune-plan.ts'

const entry = (source: string, variant: string): ManifestEntry => ({
  source,
  sourceUrl: '',
  sourceSha256: '',
  sourceBytes: 1,
  sourceWidth: 1,
  sourceHeight: 1,
  variant,
  settings: '',
  contentType: 'image/webp',
  sha256: '',
  bytes: 1,
  width: 1,
  height: 1,
  uploadedAt: '',
})

const manifest: Manifest = {
  job: 'recipe photos',
  bucket: 'b',
  objects: {
    'r1/a.webp': entry('r1/a.png', 'full'),
    'r1/a.thumb.webp': entry('r1/a.png', 'thumb'),
    'r1/a.card.webp': entry('r1/a.png', 'card'),
    'r2/b.webp': entry('r2/b.jpg', 'full'),
    'r2/b.thumb.webp': entry('r2/b.jpg', 'thumb'),
    'r2/b.card.webp': entry('r2/b.jpg', 'card'),
  },
}
const backup = new Map([
  ['b/r1/a.png', { sha256: 'aaa' }],
  ['b/r2/b.jpg', { sha256: 'bbb' }],
])
const variants = { full: 'full', current: ['full', 'card'] }

describe('planPrune', () => {
  it('deletes originals of rows on their WebP, and unused superseded thumbs', () => {
    const plan = planPrune(
      [
        { id: '1', path: 'r1/a.webp', original: 'r1/a.png', thumb: 'r1/a.card.webp' },
        { id: '2', path: 'r2/b.webp', original: 'r2/b.jpg', thumb: 'r2/b.card.webp' },
      ],
      manifest,
      'b',
      backup,
      variants,
    )
    expect(plan.problems).toEqual([])
    expect(plan.deletions).toEqual([
      { kind: 'original', path: 'r1/a.png', rowId: '1', sha256: 'aaa' },
      { kind: 'original', path: 'r2/b.jpg', rowId: '2', sha256: 'bbb' },
      { kind: 'superseded-thumb', path: 'r1/a.thumb.webp' },
      { kind: 'superseded-thumb', path: 'r2/b.thumb.webp' },
    ])
  })

  it('keeps an original when the row was rolled back, replaced, or the backup lacks it', () => {
    const plan = planPrune(
      [
        { id: '1', path: 'r1/a.png', original: 'r1/a.png', thumb: null }, // not on WebP
        { id: '2', path: 'r2/new.webp', original: 'r2/b.jpg', thumb: null }, // replaced photo
      ],
      manifest,
      'b',
      new Map(),
      variants,
    )
    expect(plan.deletions.filter((d) => d.kind === 'original')).toEqual([])
    expect(plan.problems).toHaveLength(2)
  })

  it('keeps an original that is missing from the backup', () => {
    const plan = planPrune(
      [{ id: '1', path: 'r1/a.webp', original: 'r1/a.png', thumb: 'r1/a.card.webp' }],
      manifest,
      'b',
      new Map(),
      variants,
    )
    expect(plan.problems[0]).toContain('not in the backup')
  })

  it('never deletes a superseded thumb that a row still points at; rows without originals are skipped', () => {
    const plan = planPrune(
      [{ id: '1', path: 'r1/a.webp', original: null, thumb: 'r1/a.thumb.webp' }],
      manifest,
      'b',
      backup,
      variants,
    )
    expect(plan.deletions).toEqual([{ kind: 'superseded-thumb', path: 'r2/b.thumb.webp' }])
  })
})

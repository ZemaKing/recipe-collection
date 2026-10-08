import { planBackup, upsertEntry, type BackupManifest, type ManifestEntry } from './backup-plan.ts'
import type { StorageObject } from './supabase-script.ts'

const object = (path: string, bytes = 100, etag: string | null = 'e1'): StorageObject => ({
  path,
  bytes,
  mimetype: 'image/png',
  etag,
  cacheControl: 'max-age=3600',
  updatedAt: null,
})
const entry = (path: string, overrides: Partial<ManifestEntry> = {}): ManifestEntry => ({
  bucket: 'recipe-images',
  path,
  bytes: 100,
  sha256: 'abc',
  etag: 'e1',
  type: 'image/png',
  width: 10,
  height: 10,
  downloadedAt: '2026-10-08T00:00:00Z',
  ...overrides,
})
const manifest = (...entries: ManifestEntry[]): BackupManifest => ({
  version: 1,
  updatedAt: '',
  entries,
})
const local = (sha256 = 'abc', bytes = 100) => ({ bytes, sha256 })

describe('planBackup', () => {
  it('downloads everything on the first run', () => {
    const plan = planBackup(
      { 'recipe-images': [object('a/1.png'), object('a/2.png', 50)] },
      null,
      new Map(),
    )
    expect(plan.download.map((item) => item.reason)).toEqual(['new', 'new'])
    expect(plan.downloadBytes).toBe(150)
  })

  it('downloads nothing when every local copy matches the manifest', () => {
    const plan = planBackup(
      { 'recipe-images': [object('a/1.png')] },
      manifest(entry('a/1.png')),
      new Map([['recipe-images/a/1.png', local()]]),
    )
    expect(plan.download).toEqual([])
    expect(plan.downloadBytes).toBe(0)
    expect(plan.upToDate).toHaveLength(1)
  })

  it('re-downloads missing, resized, changed or corrupted copies', () => {
    const plan = planBackup(
      {
        'recipe-images': [
          object('missing.png'),
          object('resized.png', 120),
          object('etag.png', 100, 'e2'),
          object('corrupt.png'),
        ],
      },
      manifest(entry('missing.png'), entry('resized.png'), entry('etag.png'), entry('corrupt.png')),
      new Map([
        ['recipe-images/resized.png', local()],
        ['recipe-images/etag.png', local()],
        ['recipe-images/corrupt.png', local('zzz')],
      ]),
    )
    expect(plan.download.map((item) => [item.object.path, item.reason])).toEqual([
      ['missing.png', 'missing-locally'],
      ['resized.png', 'size-changed'],
      ['etag.png', 'etag-changed'],
      ['corrupt.png', 'checksum-mismatch'],
    ])
  })

  it('keys by bucket and reports objects gone from the bucket', () => {
    const plan = planBackup(
      { 'recipe-images': [], 'ingredient-images': [object('x.png')] },
      manifest(entry('x.png'), entry('old.png')),
      new Map([['recipe-images/x.png', local()]]),
    )
    expect(plan.download.map((item) => [item.bucket, item.reason])).toEqual([
      ['ingredient-images', 'new'],
    ])
    expect(plan.goneFromBucket.map((gone) => gone.path)).toEqual(['x.png', 'old.png'])
  })
})

describe('upsertEntry', () => {
  it('replaces an existing entry and keeps the list sorted', () => {
    const start = manifest(entry('b.png'), entry('c.png'))
    const next = upsertEntry(
      upsertEntry(start, entry('a.png'), 'now'),
      entry('c.png', { sha256: 'new' }),
      'later',
    )
    expect(next.entries.map((e) => [e.path, e.sha256])).toEqual([
      ['a.png', 'abc'],
      ['b.png', 'abc'],
      ['c.png', 'new'],
    ])
    expect(next.updatedAt).toBe('later')
  })
})

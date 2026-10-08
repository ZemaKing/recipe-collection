import { auditBucket, headKey, renderAuditMarkdown, type HeadResult } from './image-audit.ts'
import type { ImageReference, StorageObject } from './supabase-script.ts'

const ref = (
  path: string,
  rowId = path,
  bucket: ImageReference['bucket'] = 'recipe-images',
): ImageReference => ({
  bucket,
  table: bucket === 'recipe-images' ? 'recipe_images' : 'ingredients',
  rowId,
  path,
})
const object = (path: string, bytes: number, mimetype: string, etag: string): StorageObject => ({
  path,
  bytes,
  mimetype,
  etag,
  cacheControl: 'max-age=3600',
  updatedAt: null,
})
const ok = (bytes: number, contentType: string): HeadResult => ({
  status: 200,
  contentType,
  bytes,
  etag: null,
})

describe('auditBucket', () => {
  const objects = [
    object('r1/a.png', 1000, 'image/png', 'e1'),
    object('r2/b.jpg', 400, 'image/jpeg', 'e2'),
    object('r3/c.png', 1000, 'image/png', 'e1'),
    object('stray.png', 10, 'image/png', 'e3'),
  ]
  const refs = [
    ref('r1/a.png'),
    ref('r2/b.jpg'),
    ref('r3/c.png'),
    ref('r3/c.png', 'second'),
    ref('gone.png'),
    ref('x.png', 'i1', 'ingredient-images'),
  ]
  const heads = new Map([
    [headKey('recipe-images', 'r1/a.png'), ok(1000, 'image/png')],
    [headKey('recipe-images', 'r2/b.jpg'), ok(400, 'image/jpeg')],
    [headKey('recipe-images', 'r3/c.png'), ok(999, 'image/png')],
    [headKey('recipe-images', 'stray.png'), { ...ok(10, 'image/png'), status: 404 }],
  ])
  const audit = auditBucket('recipe-images', refs, objects, heads)

  it('counts rows, objects and bytes by format for its own bucket only', () => {
    expect(audit.rows).toBe(5)
    expect(audit.objects).toBe(4)
    expect(audit.bytes).toBe(2410)
    expect(audit.byFormat).toEqual({
      png: { count: 3, bytes: 2010, maxBytes: 1000 },
      jpeg: { count: 1, bytes: 400, maxBytes: 400 },
    })
  })

  it('finds missing objects, orphans, shared paths and duplicate content', () => {
    expect(audit.missing.map((r) => r.path)).toEqual(['gone.png'])
    expect(audit.orphans.map((o) => o.path)).toEqual(['stray.png'])
    expect(audit.sharedPaths).toEqual([{ path: 'r3/c.png', rows: ['r3/c.png', 'second'] }])
    expect(audit.duplicates).toEqual([{ etag: 'e1', bytes: 1000, paths: ['r1/a.png', 'r3/c.png'] }])
  })

  it('flags public URLs that fail or serve a different size', () => {
    expect(audit.headProblems).toEqual([
      { path: 'r3/c.png', problem: 'serves 999 B, listed 1000 B' },
      { path: 'stray.png', problem: 'HTTP 404' },
    ])
    expect(audit.cacheControl).toEqual({ 'max-age=3600': 4 })
  })

  it('renders a summary table and per-bucket sections', () => {
    const md = renderAuditMarkdown([audit], {
      generatedAt: '2026-10-08T00:00:00Z',
      mode: 'admin-login',
    })
    expect(md).toContain('**Total: 4 objects, 2.4 KB.**')
    expect(md).toContain('| `recipe-images` | 5 | 4 | 2.4 KB | 1 | 1 | 1 | 1 | 2 |')
    expect(md).toContain('- `stray.png` (10 B)')
    expect(md).not.toMatch(/\n{3,}/)
  })
})

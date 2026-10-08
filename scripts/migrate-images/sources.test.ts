// @vitest-environment node
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

import { backupIndex, pathVars, rowsToSources } from './sources.ts'

const dir = pathToFileURL(join(tmpdir(), 'backups', 'images') + '/')

const index = backupIndex(
  {
    version: 1,
    updatedAt: '',
    entries: [
      {
        bucket: 'recipe-images',
        path: 'r1/a.png',
        bytes: 10,
        sha256: 'abc',
        etag: null,
        type: 'image/png',
        width: 900,
        height: 600,
        downloadedAt: '',
      },
    ],
  },
  dir,
)

describe('pathVars', () => {
  it('splits folder and file name, dropping the extension', () => {
    expect(pathVars('r1/b7a0a59b.png')).toEqual({ folder: 'r1', name: 'b7a0a59b' })
    expect(pathVars('r1/x.JPEG')).toEqual({ folder: 'r1', name: 'x' })
  })

  it('refuses WebP originals and unexpected shapes', () => {
    expect(() => pathVars('r1/a.webp')).toThrow('already WebP')
    expect(() => pathVars('a.png')).toThrow('Unexpected')
    expect(() => pathVars('a/b/c.png')).toThrow('Unexpected')
  })
})

describe('rowsToSources', () => {
  const url = (path: string) => `https://cdn.test/${path}`

  it('uses the backup copy when there is one, else the public URL; sorted by path', () => {
    const sources = rowsToSources(
      [
        { id: '2', path: 'r2/b.jpg' },
        { id: '1', path: 'r1/a.png' },
      ],
      'recipe-images',
      url,
      index,
    )
    expect(sources.map((s) => s.key)).toEqual(['r1/a.png', 'r2/b.jpg'])
    expect(sources[0]).toMatchObject({
      url: 'https://cdn.test/r1/a.png',
      sha256: 'abc',
      vars: { folder: 'r1', name: 'a' },
    })
    expect(sources[0].file?.replaceAll('\\', '/')).toMatch(
      /backups\/images\/recipe-images\/r1\/a\.png$/,
    )
    expect(sources[1].file).toBeUndefined()
  })

  it('looks the copy up per bucket', () => {
    const [source] = rowsToSources([{ id: '1', path: 'r1/a.png' }], 'ingredient-images', url, index)
    expect(source.file).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { buildLocalizedPath, stripLangPrefix } from './localizedPath'

describe('buildLocalizedPath', () => {
  it('prefixes the language, with "/" becoming the bare language root', () => {
    expect(buildLocalizedPath('sr', '/')).toBe('/sr')
    expect(buildLocalizedPath('en', '/recepti')).toBe('/en/recepti')
    expect(buildLocalizedPath('en', '/kategorije/deserti/torte')).toBe(
      '/en/kategorije/deserti/torte',
    )
  })
})

describe('stripLangPrefix', () => {
  it('drops the first segment and keeps the rest', () => {
    expect(stripLangPrefix('/sr/recepti')).toBe('/recepti')
    expect(stripLangPrefix('/en/recepti/gibanica')).toBe('/recepti/gibanica')
    expect(stripLangPrefix('/xx/kategorije/deserti')).toBe('/kategorije/deserti')
  })

  it('is empty for a language root', () => {
    expect(stripLangPrefix('/sr')).toBe('')
    expect(stripLangPrefix('/en/')).toBe('')
    expect(stripLangPrefix('/')).toBe('')
  })

  it('round-trips with buildLocalizedPath (the language switcher)', () => {
    for (const path of ['/en/recepti', '/en/kategorije/deserti', '/en']) {
      const switched = buildLocalizedPath('sr', stripLangPrefix(path) || '/')
      expect(switched).toBe(path.replace(/^\/en/, '/sr'))
    }
  })
})

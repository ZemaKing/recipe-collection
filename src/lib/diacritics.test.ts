import { describe, expect, it } from 'vitest'
import { expandDiacriticVariants, normalizeSearchText, textMatchesQuery } from './diacritics'

describe('normalizeSearchText', () => {
  it('folds accented characters to their ASCII stand-ins', () => {
    expect(normalizeSearchText('Čorba')).toBe('corba')
    expect(normalizeSearchText('Ćevapi')).toBe('cevapi')
    expect(normalizeSearchText('Šargarepa')).toBe('sargarepa')
    expect(normalizeSearchText('Žitarice')).toBe('zitarice')
    expect(normalizeSearchText('Đevrek')).toBe('djevrek')
  })

  it('leaves plain ASCII text unchanged (aside from lowercasing)', () => {
    expect(normalizeSearchText('Corba')).toBe('corba')
  })
})

describe('textMatchesQuery', () => {
  it('matches accented text when the query is typed without diacritics', () => {
    expect(textMatchesQuery('Čorba od povrća', 'corba')).toBe(true)
    expect(textMatchesQuery('Đevrek', 'djevrek')).toBe(true)
  })

  it('matches plain text when the query is typed with diacritics', () => {
    expect(textMatchesQuery('Corba', 'čorba')).toBe(true)
  })

  it('returns false when there is no match', () => {
    expect(textMatchesQuery('Čorba', 'pasulj')).toBe(false)
  })

  it('treats an empty query as matching everything', () => {
    expect(textMatchesQuery('Čorba', '')).toBe(true)
  })
})

describe('expandDiacriticVariants', () => {
  it('expands every diacritic-letter combination', () => {
    const variants = expandDiacriticVariants('corba')
    expect(variants).toContain('corba')
    expect(variants).toContain('čorba')
    expect(variants).toContain('ćorba')
  })

  it('treats "dj" as a single unit expanding to đ', () => {
    const variants = expandDiacriticVariants('djevrek')
    expect(variants).toContain('djevrek')
    expect(variants).toContain('đevrek')
  })

  it('falls back to the literal term when the expansion would be too large', () => {
    const variants = expandDiacriticVariants('scszscszscszscsz')
    expect(variants).toEqual(['scszscszscszscsz'])
  })
})

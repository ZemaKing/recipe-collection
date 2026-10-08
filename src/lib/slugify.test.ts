import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('folds Serbian Latin letters (đ → dj, the rest drop their marks)', () => {
    expect(slugify('Pečeni Plazma čizkejk')).toBe('peceni-plazma-cizkejk')
    expect(slugify('Jagnjeći but sa začinima')).toBe('jagnjeci-but-sa-zacinima')
    expect(slugify('Džem od nara')).toBe('dzem-od-nara')
    expect(slugify('Šopska salata')).toBe('sopska-salata')
    expect(slugify('Đuveč')).toBe('djuvec')
    expect(slugify('Riđa đakonija')).toBe('ridja-djakonija')
  })

  it('folds other accents too', () => {
    expect(slugify('Chestnut Purée')).toBe('chestnut-puree')
  })

  it('collapses punctuation and spaces into single hyphens, trimmed at both ends', () => {
    expect(slugify('  Pasta s rukolom, pršutom i pečurkama!  ')).toBe(
      'pasta-s-rukolom-prsutom-i-pecurkama',
    )
    expect(slugify("Grandma's Cake")).toBe('grandma-s-cake')
    expect(slugify('Sauces, Dressings & Spreads')).toBe('sauces-dressings-spreads')
    expect(slugify('--Tres   Leches--')).toBe('tres-leches')
  })

  it('keeps digits and returns empty for input without letters or digits', () => {
    expect(slugify('Torta 3 boje')).toBe('torta-3-boje')
    expect(slugify('!!!')).toBe('')
    expect(slugify('')).toBe('')
  })
})

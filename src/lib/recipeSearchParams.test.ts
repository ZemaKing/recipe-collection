import { describe, expect, it } from 'vitest'
import { parseSortParam, parseTagsParam, toggleTagInParams } from './recipeSearchParams'

describe('parseTagsParam', () => {
  it('splits the comma list, dropping empty entries', () => {
    expect(parseTagsParam(new URLSearchParams('tags=plazma,brzi-recepti'))).toEqual([
      'plazma',
      'brzi-recepti',
    ])
    expect(parseTagsParam(new URLSearchParams('tags=,plazma,,'))).toEqual(['plazma'])
  })

  it('is empty when the param is missing or blank', () => {
    expect(parseTagsParam(new URLSearchParams())).toEqual([])
    expect(parseTagsParam(new URLSearchParams('tags='))).toEqual([])
  })
})

describe('parseSortParam', () => {
  it('accepts rating and time, and falls back to recent', () => {
    expect(parseSortParam(new URLSearchParams('sort=rating'))).toBe('rating')
    expect(parseSortParam(new URLSearchParams('sort=time'))).toBe('time')
    expect(parseSortParam(new URLSearchParams('sort=recent'))).toBe('recent')
    expect(parseSortParam(new URLSearchParams('sort=bogus'))).toBe('recent')
    expect(parseSortParam(new URLSearchParams())).toBe('recent')
  })
})

describe('toggleTagInParams', () => {
  it('appends a missing tag and keeps the other params', () => {
    const next = toggleTagInParams(new URLSearchParams('q=pita&tags=plazma'), 'vegetarijanski')
    expect(next.get('tags')).toBe('plazma,vegetarijanski')
    expect(next.get('q')).toBe('pita')
  })

  it('removes a present tag, and the param with the last one', () => {
    const one = toggleTagInParams(new URLSearchParams('tags=plazma,vegetarijanski'), 'plazma')
    expect(one.get('tags')).toBe('vegetarijanski')
    const none = toggleTagInParams(one, 'vegetarijanski')
    expect(none.has('tags')).toBe(false)
  })

  it("doesn't mutate the params it was given", () => {
    const params = new URLSearchParams('tags=plazma')
    toggleTagInParams(params, 'bez-glutena')
    expect(params.toString()).toBe('tags=plazma')
  })
})

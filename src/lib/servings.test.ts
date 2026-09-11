import { describe, expect, it } from 'vitest'
import { formatQuantity, scaleQuantity } from './servings'

describe('scaleQuantity', () => {
  it('scales up proportionally', () => {
    expect(scaleQuantity(500, 4, 6)).toBe(750)
  })

  it('scales down proportionally', () => {
    expect(scaleQuantity(500, 4, 2)).toBe(250)
  })

  it('returns the same quantity when servings are unchanged', () => {
    expect(scaleQuantity(500, 4, 4)).toBe(500)
  })

  it('falls back to the original quantity when the recipe has no base servings', () => {
    expect(scaleQuantity(500, null, 8)).toBe(500)
    expect(scaleQuantity(500, 0, 8)).toBe(500)
  })

  it('handles fractional results', () => {
    expect(scaleQuantity(1, 3, 1)).toBeCloseTo(0.3333, 4)
  })
})

describe('formatQuantity', () => {
  it('strips trailing zeros from whole numbers', () => {
    expect(formatQuantity(750)).toBe('750')
    expect(formatQuantity(2)).toBe('2')
  })

  it('rounds to at most 2 decimals', () => {
    expect(formatQuantity(0.33333)).toBe('0.33')
    expect(formatQuantity(1.005)).toBe('1')
  })

  it('strips a trailing zero from one-decimal results', () => {
    expect(formatQuantity(1.5)).toBe('1.5')
    expect(formatQuantity(1.5).endsWith('0')).toBe(false)
  })
})

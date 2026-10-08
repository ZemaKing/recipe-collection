import { describe, expect, it } from 'vitest'
import {
  nextOrderIndex,
  pickPromotedPrimary,
  planImageMove,
  swapOrderIndex,
  withPrimary,
} from './recipeImageOrder'

const img = (id: string, order_index: number, is_primary = false) => ({
  id,
  order_index,
  is_primary,
})

describe('nextOrderIndex', () => {
  it('is 1 for the first photo, then one past the highest (gaps kept)', () => {
    expect(nextOrderIndex([])).toBe(1)
    expect(nextOrderIndex([img('a', 1), img('b', 2)])).toBe(3)
    expect(nextOrderIndex([img('a', 5), img('b', 2)])).toBe(6)
  })
})

describe('pickPromotedPrimary', () => {
  it('picks the lowest order_index, regardless of array order', () => {
    const remaining = [img('c', 4), img('b', 2), img('d', 3)]
    expect(pickPromotedPrimary(remaining)?.id).toBe('b')
  })

  it('is null when no photo is left', () => {
    expect(pickPromotedPrimary([])).toBeNull()
  })
})

describe('planImageMove', () => {
  const images = [img('c', 3), img('a', 1), img('b', 2)]

  it('pairs the photo with its neighbour in order_index order', () => {
    expect(planImageMove(images, 'b', -1)).toEqual({ current: img('b', 2), target: img('a', 1) })
    expect(planImageMove(images, 'b', 1)).toEqual({ current: img('b', 2), target: img('c', 3) })
  })

  it('is null at either end or for an unknown id', () => {
    expect(planImageMove(images, 'a', -1)).toBeNull()
    expect(planImageMove(images, 'c', 1)).toBeNull()
    expect(planImageMove(images, 'zz', 1)).toBeNull()
  })
})

describe('swapOrderIndex', () => {
  it('swaps only the planned pair and keeps the array order', () => {
    const images = [img('a', 1), img('b', 2), img('c', 3)]
    const move = planImageMove(images, 'c', -1)!
    expect(swapOrderIndex(images, move)).toEqual([img('a', 1), img('b', 3), img('c', 2)])
    // The input is untouched.
    expect(images[1].order_index).toBe(2)
  })

  it('moving down then up restores the original order', () => {
    const images = [img('a', 1), img('b', 2)]
    const down = swapOrderIndex(images, planImageMove(images, 'a', 1)!)
    const back = swapOrderIndex(down, planImageMove(down, 'a', -1)!)
    expect(back).toEqual(images)
  })
})

describe('withPrimary', () => {
  it('leaves exactly one primary', () => {
    const images = [img('a', 1, true), img('b', 2), img('c', 3)]
    expect(withPrimary(images, 'c').map((i) => [i.id, i.is_primary])).toEqual([
      ['a', false],
      ['b', false],
      ['c', true],
    ])
  })

  it('keeps unchanged photos as the same objects', () => {
    const images = [img('a', 1, true), img('b', 2)]
    const next = withPrimary(images, 'a')
    expect(next[0]).toBe(images[0])
    expect(next[1]).toBe(images[1])
  })
})

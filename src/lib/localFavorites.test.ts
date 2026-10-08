import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LOCAL_FAVORITES_KEY,
  applyLocalFavorites,
  favoriteIdsKey,
  getLocalFavoriteIds,
  idsFromKey,
  parseFavoriteIds,
  resetLocalFavoritesCache,
  subscribeLocalFavorites,
  toggleFavoriteId,
  toggleLocalFavorite,
} from './localFavorites'

afterEach(() => {
  window.localStorage.clear()
  resetLocalFavoritesCache()
  vi.restoreAllMocks()
})

describe('parseFavoriteIds', () => {
  it('reads a JSON array of ids, dropping duplicates and non-strings', () => {
    expect(parseFavoriteIds('["a","b","a",3,null,""]')).toEqual(['a', 'b'])
  })

  it('returns [] for missing, malformed or non-array values', () => {
    expect(parseFavoriteIds(null)).toEqual([])
    expect(parseFavoriteIds('{not json')).toEqual([])
    expect(parseFavoriteIds('{"a":1}')).toEqual([])
  })
})

describe('toggleFavoriteId', () => {
  it('adds a missing id and removes a present one', () => {
    expect(toggleFavoriteId(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleFavoriteId(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('applyLocalFavorites', () => {
  it("overrides is_favorite with the visitor's set", () => {
    const ids = new Set(['r1'])
    expect(applyLocalFavorites({ id: 'r1', is_favorite: false }, ids).is_favorite).toBe(true)
    expect(applyLocalFavorites({ id: 'r2', is_favorite: true }, ids).is_favorite).toBe(false)
  })

  it('returns the same object when nothing changes', () => {
    const recipe = { id: 'r1', is_favorite: true }
    expect(applyLocalFavorites(recipe, new Set(['r1']))).toBe(recipe)
  })
})

describe('favoriteIdsKey / idsFromKey', () => {
  it('is null for the admin and order-independent for visitors', () => {
    expect(favoriteIdsKey(null)).toBeNull()
    expect(favoriteIdsKey(['b', 'a'])).toBe(favoriteIdsKey(['a', 'b']))
  })

  it('round-trips, including the empty set', () => {
    expect(idsFromKey(favoriteIdsKey(['a', 'b'])!)).toEqual(['a', 'b'])
    expect(idsFromKey(favoriteIdsKey([])!)).toEqual([])
  })
})

describe('local favourites store', () => {
  it('persists toggles to localStorage and notifies subscribers', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeLocalFavorites(listener)

    toggleLocalFavorite('r1')
    expect(getLocalFavoriteIds()).toEqual(['r1'])
    expect(JSON.parse(window.localStorage.getItem(LOCAL_FAVORITES_KEY)!)).toEqual(['r1'])
    expect(listener).toHaveBeenCalledTimes(1)

    toggleLocalFavorite('r1')
    expect(getLocalFavoriteIds()).toEqual([])
    unsubscribe()
  })

  it('returns a stable snapshot between changes', () => {
    window.localStorage.setItem(LOCAL_FAVORITES_KEY, '["r1"]')
    expect(getLocalFavoriteIds()).toBe(getLocalFavoriteIds())
  })

  it('picks up changes made in another tab', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeLocalFavorites(listener)
    getLocalFavoriteIds()

    window.localStorage.setItem(LOCAL_FAVORITES_KEY, '["r9"]')
    window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_FAVORITES_KEY }))

    expect(listener).toHaveBeenCalledTimes(1)
    expect(getLocalFavoriteIds()).toEqual(['r9'])
    unsubscribe()
  })

  it('still works in memory when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(getLocalFavoriteIds()).toEqual([])
    toggleLocalFavorite('r1')
    expect(getLocalFavoriteIds()).toEqual(['r1'])
  })
})

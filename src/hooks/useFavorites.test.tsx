import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/components/auth/authContext'
import { LOCAL_FAVORITES_KEY, resetLocalFavoritesCache } from '@/lib/localFavorites'
import { useFavorites } from './useFavorites'

// Phase 33, Open decision 3: the admin's hearts write recipes.is_favorite,
// everyone else's (signed out or a signed-in non-admin) stay in localStorage.

function renderFavorites(isAdmin: boolean) {
  const auth: AuthContextValue = {
    session: null,
    isAdmin,
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  )
  return renderHook(() => useFavorites(), { wrapper })
}

const recipe = (id: string, is_favorite: boolean) => ({ id, is_favorite, name: id })

afterEach(() => {
  window.localStorage.clear()
  resetLocalFavoritesCache()
})

describe('useFavorites as a visitor', () => {
  it('toggles in localStorage and never calls the database', () => {
    const { result } = renderFavorites(false)
    const toggleInDatabase = vi.fn().mockResolvedValue(undefined)

    act(() => result.current.toggle('r1', toggleInDatabase))

    expect(toggleInDatabase).not.toHaveBeenCalled()
    expect(JSON.parse(window.localStorage.getItem(LOCAL_FAVORITES_KEY)!)).toEqual(['r1'])
    expect(result.current.localIds).toEqual(['r1'])

    act(() => result.current.toggle('r1', toggleInDatabase))
    expect(result.current.localIds).toEqual([])
  })

  it("shows the visitor's own hearts, not the owner's column", () => {
    window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(['mine']))
    const { result } = renderFavorites(false)

    expect(result.current.apply(recipe('mine', false)).is_favorite).toBe(true)
    // The owner hearted this one; a visitor doesn't see that as their own.
    expect(result.current.apply(recipe('owners', true)).is_favorite).toBe(false)
  })

  it('re-renders with the new set after a toggle', () => {
    const { result } = renderFavorites(false)
    expect(result.current.apply(recipe('r2', false)).is_favorite).toBe(false)

    act(() => result.current.toggle('r2', vi.fn()))
    expect(result.current.apply(recipe('r2', false)).is_favorite).toBe(true)
  })
})

describe('useFavorites as the admin', () => {
  it('toggles through the database and leaves localStorage alone', () => {
    const { result } = renderFavorites(true)
    const toggleInDatabase = vi.fn().mockResolvedValue(undefined)

    act(() => result.current.toggle('r1', toggleInDatabase))

    expect(toggleInDatabase).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem(LOCAL_FAVORITES_KEY)).toBeNull()
  })

  it('uses the is_favorite column as is (localIds null = filter by the column)', () => {
    window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(['r1']))
    const { result } = renderFavorites(true)

    expect(result.current.localIds).toBeNull()
    const row = recipe('r1', false)
    expect(result.current.apply(row)).toBe(row)
  })
})

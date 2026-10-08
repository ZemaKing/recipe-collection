import { useMemo, useSyncExternalStore } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  applyLocalFavorites,
  getLocalFavoriteIds,
  getServerLocalFavoriteIds,
  subscribeLocalFavorites,
  toggleLocalFavorite,
} from '@/lib/localFavorites'

// Who owns the hearts: the admin edits recipes.is_favorite (the owner's
// favourites, through each data hook's own toggleFavorite); everyone else
// keeps their own set in localStorage.
export function useFavorites() {
  const { isAdmin } = useAuth()
  const storedIds = useSyncExternalStore(
    subscribeLocalFavorites,
    getLocalFavoriteIds,
    getServerLocalFavoriteIds,
  )

  return useMemo(() => {
    const idSet = new Set(storedIds)
    return {
      // null = filter by the recipes.is_favorite column instead.
      localIds: isAdmin ? null : storedIds,
      apply<T extends { id: string; is_favorite: boolean }>(recipe: T): T {
        return isAdmin ? recipe : applyLocalFavorites(recipe, idSet)
      },
      toggle(recipeId: string, toggleInDatabase: () => Promise<void>) {
        if (isAdmin) void toggleInDatabase()
        else toggleLocalFavorite(recipeId)
      },
    }
  }, [isAdmin, storedIds])
}

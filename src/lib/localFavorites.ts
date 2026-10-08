// Per-visitor favourites (Phase 33, Open decision 3). Visitors can't write
// recipes.is_favorite — that column is the owner's — so their hearts live in
// localStorage instead. The admin keeps using the column.

export const LOCAL_FAVORITES_KEY = 'recipe-collection:favorites'

const EMPTY: readonly string[] = Object.freeze([])

export function parseFavoriteIds(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)),
    ]
  } catch {
    return []
  }
}

export function toggleFavoriteId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]
}

// Overrides each recipe's is_favorite with membership in the visitor's set.
export function applyLocalFavorites<T extends { id: string; is_favorite: boolean }>(
  recipe: T,
  ids: ReadonlySet<string>,
): T {
  const isFavorite = ids.has(recipe.id)
  return recipe.is_favorite === isFavorite ? recipe : { ...recipe, is_favorite: isFavorite }
}

// Stable effect-dependency key for hooks that query by the visitor's ids:
// null for the admin (use the column), otherwise the sorted ids joined.
export function favoriteIdsKey(localIds: readonly string[] | null): string | null {
  return localIds === null ? null : [...localIds].sort().join(',')
}

export function idsFromKey(key: string): string[] {
  return key ? key.split(',') : []
}

// --- external store for useSyncExternalStore -------------------------------
// The snapshot is cached so getSnapshot returns a stable reference between
// changes. Storage access is wrapped: it throws in some private modes.

let snapshot: readonly string[] | null = null
const listeners = new Set<() => void>()

function readStorage(): readonly string[] {
  try {
    return parseFavoriteIds(window.localStorage.getItem(LOCAL_FAVORITES_KEY))
  } catch {
    return EMPTY
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== LOCAL_FAVORITES_KEY) return
  snapshot = readStorage()
  emit()
}

export function getLocalFavoriteIds(): readonly string[] {
  if (snapshot === null) snapshot = readStorage()
  return snapshot
}

export function getServerLocalFavoriteIds(): readonly string[] {
  return EMPTY
}

export function setLocalFavoriteIds(ids: readonly string[]) {
  snapshot = [...ids]
  try {
    window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(snapshot))
  } catch {
    // Not persisted, but still applied for this page session.
  }
  emit()
}

export function toggleLocalFavorite(id: string) {
  setLocalFavoriteIds(toggleFavoriteId(getLocalFavoriteIds(), id))
}

// Other tabs write through the `storage` event, which keeps them in sync.
export function subscribeLocalFavorites(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', handleStorageEvent)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', handleStorageEvent)
  }
}

// Test-only: forget the cached snapshot so the next read hits localStorage.
export function resetLocalFavoritesCache() {
  snapshot = null
}

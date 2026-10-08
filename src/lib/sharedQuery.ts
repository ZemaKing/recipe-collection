// A module-level cache for one unparameterised query (the category, tag and
// subcategory lists, the full recipe list), read through useSharedQuery.
// Consumers that mount together (the sidebar and the page on the same
// navigation) share one request, and a later mount shows the last result at
// once while it refetches in the background (stale-while-revalidate), so no
// invalidation is needed after admin edits. Deliberately not a general data
// library: ROADMAP Phase 40 measured that nothing more is worth a dependency.
export interface SharedQuery<T> {
  // The last successful result, if any.
  peek(): T | undefined
  // Starts a fetch, or joins the one already in flight.
  fetch(): Promise<T>
  // Replaces the cached result (optimistic updates such as favourite toggles).
  set(value: T): void
}

export function createSharedQuery<T>(fetcher: () => Promise<T>): SharedQuery<T> {
  let value: T | undefined
  let pending: Promise<T> | null = null

  return {
    peek: () => value,
    fetch() {
      pending ??= fetcher()
        .then((result) => {
          value = result
          return result
        })
        .finally(() => {
          pending = null
        })
      return pending
    },
    set(next) {
      value = next
    },
  }
}

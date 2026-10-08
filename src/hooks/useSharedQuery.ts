import { useCallback, useEffect, useState } from 'react'
import type { SharedQuery } from '@/lib/sharedQuery'

// Shows the query's cached result right away (isLoading only when there is
// none yet) and refetches on mount. `update` changes both this component's
// copy and the cache, so an optimistic edit survives a remount.
export function useSharedQuery<T>(query: SharedQuery<T>, initial: T) {
  const [data, setData] = useState<T>(() => query.peek() ?? initial)
  const [isLoading, setIsLoading] = useState(() => query.peek() === undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    query.fetch().then(
      (result) => {
        if (cancelled) return
        setData(result)
        setError(null)
        setIsLoading(false)
      },
      (reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : String(reason))
        setIsLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [query])

  const update = useCallback(
    (updater: (previous: T) => T) => {
      setData((previous) => {
        const next = updater(previous)
        query.set(next)
        return next
      })
    },
    [query],
  )

  return { data, isLoading, error, update }
}

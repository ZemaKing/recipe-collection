import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createSharedQuery } from '@/lib/sharedQuery'
import { useSharedQuery } from './useSharedQuery'

describe('useSharedQuery', () => {
  it('loads, then shows the cached result at once on the next mount while refetching', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(['first']).mockResolvedValueOnce(['second'])
    const query = createSharedQuery<string[]>(fetcher)

    const first = renderHook(() => useSharedQuery(query, []))
    expect(first.result.current.isLoading).toBe(true)
    expect(first.result.current.data).toEqual([])
    await waitFor(() => expect(first.result.current.data).toEqual(['first']))
    expect(first.result.current.isLoading).toBe(false)
    first.unmount()

    const second = renderHook(() => useSharedQuery(query, []))
    expect(second.result.current.isLoading).toBe(false)
    expect(second.result.current.data).toEqual(['first'])
    await waitFor(() => expect(second.result.current.data).toEqual(['second']))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('two consumers mounted together share one request', async () => {
    const fetcher = vi.fn().mockResolvedValue(['x'])
    const query = createSharedQuery<string[]>(fetcher)

    const a = renderHook(() => useSharedQuery(query, []))
    const b = renderHook(() => useSharedQuery(query, []))
    await waitFor(() => expect(b.result.current.data).toEqual(['x']))
    expect(a.result.current.data).toEqual(['x'])
    // StrictMode isn't on here, so one request for both.
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('reports a failed fetch', async () => {
    const query = createSharedQuery<string[]>(() => Promise.reject(new Error('offline')))
    const { result } = renderHook(() => useSharedQuery(query, []))
    await waitFor(() => expect(result.current.error).toBe('offline'))
    expect(result.current.isLoading).toBe(false)
  })

  it('update changes the cache too, so a remount keeps an optimistic edit', async () => {
    const query = createSharedQuery<number[]>(() => new Promise(() => {}))
    query.set([1, 2])
    const { result, unmount } = renderHook(() => useSharedQuery(query, []))
    act(() => result.current.update((previous) => previous.filter((n) => n !== 1)))
    expect(result.current.data).toEqual([2])
    unmount()
    expect(query.peek()).toEqual([2])
  })
})

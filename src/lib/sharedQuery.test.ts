import { describe, expect, it, vi } from 'vitest'
import { createSharedQuery } from './sharedQuery'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('createSharedQuery', () => {
  it('joins the fetch already in flight instead of starting another', async () => {
    const pending = deferred<string[]>()
    const fetcher = vi.fn(() => pending.promise)
    const query = createSharedQuery(fetcher)

    const first = query.fetch()
    const second = query.fetch()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(query.peek()).toBeUndefined()

    pending.resolve(['a'])
    await expect(first).resolves.toEqual(['a'])
    await expect(second).resolves.toEqual(['a'])
    expect(query.peek()).toEqual(['a'])
  })

  it('refetches once the previous fetch has settled', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2)
    const query = createSharedQuery<number>(fetcher)

    await query.fetch()
    await expect(query.fetch()).resolves.toBe(2)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(query.peek()).toBe(2)
  })

  it('keeps the last good result when a fetch fails, and can fetch again', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('good')
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce('again')
    const query = createSharedQuery<string>(fetcher)

    await query.fetch()
    await expect(query.fetch()).rejects.toThrow('down')
    expect(query.peek()).toBe('good')
    await expect(query.fetch()).resolves.toBe('again')
  })

  it('set replaces the cached result', () => {
    const query = createSharedQuery(() => Promise.resolve(0))
    query.set(5)
    expect(query.peek()).toBe(5)
  })
})

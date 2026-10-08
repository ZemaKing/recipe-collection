import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void

interface FakeInstance {
  callback: Callback
  options?: IntersectionObserverInit
  disconnect: ReturnType<typeof vi.fn>
}

function installObserver() {
  const instances: FakeInstance[] = []
  class FakeObserver {
    disconnect = vi.fn()
    constructor(callback: Callback, options?: IntersectionObserverInit) {
      instances.push({ callback, options, disconnect: this.disconnect })
    }
    observe() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  return instances
}

// The first-scroll flag is module state, so each test gets a fresh copy.
async function load() {
  return import('./useNearViewport')
}

function elementIn(container: HTMLElement) {
  const element = document.createElement('div')
  container.appendChild(element)
  document.body.appendChild(container)
  return element
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('useNearViewport', () => {
  it('is true from the start without IntersectionObserver (jsdom)', async () => {
    const { useNearViewport } = await load()
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useNearViewport(ref))
    expect(result.current).toBe(true)
  })

  it('is true from the start when disabled (eager images)', async () => {
    installObserver()
    const { useNearViewport } = await load()
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useNearViewport(ref, false))
    expect(result.current).toBe(true)
  })

  it('watches only the visible area until the first scroll, then looks ahead in the scroll container', async () => {
    const instances = installObserver()
    const { NEAR_VIEWPORT_MARGIN, useNearViewport } = await load()
    const main = document.createElement('main')
    main.style.overflowY = 'auto'
    const ref = { current: elementIn(main) }

    const { result } = renderHook(() => useNearViewport(ref))
    expect(result.current).toBe(false)
    expect(instances).toHaveLength(1)
    expect(instances[0].options).toEqual({ root: main, rootMargin: '0px' })

    act(() => {
      main.dispatchEvent(new Event('scroll'))
    })
    expect(instances[0].disconnect).toHaveBeenCalled()
    expect(instances[1].options).toEqual({ root: main, rootMargin: NEAR_VIEWPORT_MARGIN })

    act(() => instances[1].callback([{ isIntersecting: false }]))
    expect(result.current).toBe(false)
    act(() => instances[1].callback([{ isIntersecting: true }]))
    expect(result.current).toBe(true)
    expect(instances[1].disconnect).toHaveBeenCalled()
  })

  it('looks ahead right away once the visitor has scrolled before', async () => {
    const instances = installObserver()
    const { NEAR_VIEWPORT_MARGIN, useNearViewport } = await load()
    const first = { current: elementIn(document.createElement('div')) }
    renderHook(() => useNearViewport(first))
    act(() => {
      document.dispatchEvent(new Event('scroll'))
    })

    const later = { current: elementIn(document.createElement('div')) }
    renderHook(() => useNearViewport(later))
    expect(instances.at(-1)?.options).toEqual({ root: null, rootMargin: NEAR_VIEWPORT_MARGIN })
  })
})

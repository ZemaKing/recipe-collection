import { useEffect, useState, type RefObject } from 'react'

// How far ahead of the visible area an element counts as "near", once the
// visitor has scrolled. Native loading="lazy" starts 1250–2500 px out, which
// on a phone fetched every card photo of a grid at once and starved the
// visible ones (docs/performance.md); until the first scroll only what is on
// screen loads, so the LCP photo gets the bandwidth.
export const NEAR_VIEWPORT_MARGIN = '600px 0px'

let hasScrolled = false
const firstScrollListeners = new Set<() => void>()

function onFirstScroll() {
  hasScrolled = true
  document.removeEventListener('scroll', onFirstScroll, { capture: true })
  for (const listener of firstScrollListeners) listener()
  firstScrollListeners.clear()
}

function afterFirstScroll(listener: () => void): () => void {
  if (firstScrollListeners.size === 0) {
    // Capture: the page scrolls inside AppShell's <main>, and scroll events don't bubble.
    document.addEventListener('scroll', onFirstScroll, { capture: true, passive: true })
  }
  firstScrollListeners.add(listener)
  return () => firstScrollListeners.delete(listener)
}

// The element's scroll container (AppShell's <main>), so the margin reaches
// past what it clips; null (the viewport) if there is none.
function scrollParent(element: Element): Element | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node
  }
  return null
}

// True once the element is on screen (before the first scroll) or within
// NEAR_VIEWPORT_MARGIN of it (after); stays true afterwards. Without
// IntersectionObserver (jsdom) it's always true.
export function useNearViewport(ref: RefObject<Element | null>, enabled = true): boolean {
  const [isNear, setIsNear] = useState(
    () => !enabled || typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const element = ref.current
    if (isNear || !element) return
    const target: Element = element
    const root = scrollParent(target)
    let observer: IntersectionObserver | null = null

    function observe(rootMargin: string) {
      observer?.disconnect()
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setIsNear(true)
            observer?.disconnect()
          }
        },
        { root, rootMargin },
      )
      observer.observe(target)
    }

    observe(hasScrolled ? NEAR_VIEWPORT_MARGIN : '0px')
    const unsubscribe = hasScrolled
      ? undefined
      : afterFirstScroll(() => observe(NEAR_VIEWPORT_MARGIN))
    return () => {
      unsubscribe?.()
      observer?.disconnect()
    }
  }, [ref, isNear])

  return isNear
}

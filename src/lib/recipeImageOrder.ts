// Pure ordering rules behind useRecipeImages: where a new photo goes, which
// photo becomes primary when the primary is removed, and how moving a photo
// swaps order_index with its neighbour. The hook does the Supabase writes.

interface OrderedImage {
  id: string
  is_primary: boolean
  order_index: number
}

// The order_index for a photo appended after every existing one (1 for the first).
export function nextOrderIndex(images: readonly Pick<OrderedImage, 'order_index'>[]): number {
  return images.reduce((max, img) => Math.max(max, img.order_index), 0) + 1
}

// After removing the primary photo, the remaining one with the lowest
// order_index takes over; null when nothing is left.
export function pickPromotedPrimary<T extends OrderedImage>(remaining: readonly T[]): T | null {
  if (remaining.length === 0) return null
  return remaining.reduce((first, img) => (img.order_index < first.order_index ? img : first))
}

// The pair whose order_index values swap when `imageId` moves one place
// (-1 = earlier, 1 = later); null when it's unknown or already at that end.
export function planImageMove<T extends OrderedImage>(
  images: readonly T[],
  imageId: string,
  direction: -1 | 1,
): { current: T; target: T } | null {
  const sorted = [...images].sort((a, b) => a.order_index - b.order_index)
  const index = sorted.findIndex((img) => img.id === imageId)
  const targetIndex = index + direction
  if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) return null
  return { current: sorted[index], target: sorted[targetIndex] }
}

// Applies a planned move to the list (other photos and the array order untouched).
export function swapOrderIndex<T extends OrderedImage>(
  images: readonly T[],
  move: { current: T; target: T },
): T[] {
  const { current, target } = move
  return images.map((img) => {
    if (img.id === current.id) return { ...img, order_index: target.order_index }
    if (img.id === target.id) return { ...img, order_index: current.order_index }
    return img
  })
}

// Exactly one primary: `imageId`.
export function withPrimary<T extends OrderedImage>(images: readonly T[], imageId: string): T[] {
  return images.map((img) =>
    img.is_primary === (img.id === imageId) ? img : { ...img, is_primary: img.id === imageId },
  )
}

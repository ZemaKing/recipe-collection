// Fixed display order for categories, wherever they're listed (sidebar,
// /kategorije grid, category select dropdowns, admin category list) —
// not alphabetical, chosen to match how dishes are naturally grouped
// (breakfast through drinks, with the catch-all "Other" always last).
export const CATEGORY_SLUG_ORDER = [
  'dorucak',
  'predjela',
  'supe-i-corbe',
  'glavna-jela',
  'prilozi',
  'salate',
  'peciva',
  'deserti',
  'sosovi-prelivi-i-namazi',
  'pica-i-napici',
]

export function compareCategoryOrder(slugA: string, slugB: string): number {
  const indexA = CATEGORY_SLUG_ORDER.indexOf(slugA)
  const indexB = CATEGORY_SLUG_ORDER.indexOf(slugB)
  return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
}

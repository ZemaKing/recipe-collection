import type { SortOption } from '@/lib/recipeFilter'

export const QUERY_PARAM = 'q'
export const TAGS_PARAM = 'tags'
export const CATEGORY_PARAM = 'category'
export const FAVORITE_PARAM = 'favorite'
export const SORT_PARAM = 'sort'

export function parseTagsParam(params: URLSearchParams): string[] {
  const raw = params.get(TAGS_PARAM)
  return raw ? raw.split(',').filter(Boolean) : []
}

export function parseSortParam(params: URLSearchParams): SortOption {
  const raw = params.get(SORT_PARAM)
  return raw === 'rating' || raw === 'time' ? raw : 'recent'
}

export function toggleTagInParams(params: URLSearchParams, tagSlug: string): URLSearchParams {
  const current = parseTagsParam(params)
  const next = current.includes(tagSlug)
    ? current.filter((slug) => slug !== tagSlug)
    : [...current, tagSlug]

  const updated = new URLSearchParams(params)
  if (next.length > 0) {
    updated.set(TAGS_PARAM, next.join(','))
  } else {
    updated.delete(TAGS_PARAM)
  }
  return updated
}

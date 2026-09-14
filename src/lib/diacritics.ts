// Serbian Latin diacritics (š č ć đ ž) aren't easy to type on most
// keyboards, so every search box in the app should also match when the
// user types the plain-ASCII stand-in instead (š→s, č/ć→c, ž→z, đ→dj) —
// and vice versa, if they do have the accented keys.
const DIACRITIC_GROUPS: string[][] = [
  ['s', 'š'],
  ['c', 'č', 'ć'],
  ['z', 'ž'],
  ['dj', 'đ'],
]

function findGroup(token: string): string[] | undefined {
  return DIACRITIC_GROUPS.find((group) => group.includes(token))
}

const FOLD_MAP: Record<string, string> = {}
for (const group of DIACRITIC_GROUPS) {
  for (const char of group) FOLD_MAP[char] = group[0]
}

// Client-side comparisons: fold both the haystack and the query down to the
// same plain-ASCII form before comparing, so "čorba".includes("corba") (and
// vice versa) both work regardless of which form was typed/stored.
export function normalizeSearchText(value: string): string {
  const lower = value.toLowerCase()
  let result = ''
  for (let i = 0; i < lower.length; i++) {
    const pair = lower.slice(i, i + 2)
    if (FOLD_MAP[pair]) {
      result += FOLD_MAP[pair]
      i++
      continue
    }
    result += FOLD_MAP[lower[i]] ?? lower[i]
  }
  return result
}

export function textMatchesQuery(text: string, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true
  return normalizeSearchText(text).includes(normalizedQuery)
}

// Server-side (Supabase `ilike`) searches can't fold accents on the DB side
// without a Postgres extension, so instead expand the typed term into every
// accented/plain variant and OR them together (e.g. "corba" → also tries
// "čorba", "ćorba", ...). Bounded by `limit` to avoid combinatorial blowup
// on unusually long, diacritic-heavy input — falls back to the literal term.
export function expandDiacriticVariants(term: string, limit = 32): string[] {
  const lower = term.toLowerCase()
  const groups: string[][] = []
  for (let i = 0; i < lower.length; i++) {
    const pair = lower.slice(i, i + 2)
    const pairGroup = findGroup(pair)
    if (pairGroup) {
      groups.push(pairGroup)
      i++
      continue
    }
    groups.push(findGroup(lower[i]) ?? [lower[i]])
  }

  let results = ['']
  for (const group of groups) {
    if (results.length * group.length > limit) return [lower]
    results = results.flatMap((prefix) => group.map((variant) => prefix + variant))
  }
  return results
}

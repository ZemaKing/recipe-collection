// The expected side of the E2E assertions: the recipes read straight from PostgREST with the
// public anon key (GET only: exactly what a visitor can see). Deliberately does not reuse
// src/lib (recipeFilter, diacritics, …), so a bug in the app's filtering can't also move the
// oracle. Counts follow the live data, so adding a recipe never breaks the suite.
import { readFileSync } from 'node:fs'
import { loadEnv } from './env.ts'

export type Lang = 'sr' | 'en'

interface Named {
  slug: string
  name_en: string
  name_sr: string | null
}

export interface Recipe extends Named {
  category: Named | null
  subcategory: Named | null
  tagSlugs: string[]
  ingredientNames: string[]
}

export interface Catalog {
  recipes: Recipe[]
  categories: Named[]
  subcategories: (Named & { categorySlug: string })[]
  tags: Named[]
}

async function restGet<T>(path: string): Promise<T> {
  const { url, anonKey } = loadEnv()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  })
  if (!response.ok) {
    throw new Error(`E2E oracle: GET ${path} → HTTP ${response.status} ${await response.text()}`)
  }
  return (await response.json()) as T
}

interface RecipeRow extends Named {
  category: Named | null
  subcategory: Named | null
  recipe_tags: { tags: { slug: string } | null }[]
  recipe_ingredients: { name_en: string | null; name_sr: string | null }[]
}

export async function fetchCatalog(): Promise<Catalog> {
  const [rows, categories, subcategoryRows, tags] = await Promise.all([
    restGet<RecipeRow[]>(
      'recipes?select=slug,name_en,name_sr,category:categories(slug,name_en,name_sr),' +
        'subcategory:subcategories(slug,name_en,name_sr),recipe_tags(tags(slug)),' +
        'recipe_ingredients(name_en,name_sr)',
    ),
    restGet<Named[]>('categories?select=slug,name_en,name_sr'),
    restGet<(Named & { category: { slug: string } })[]>(
      'subcategories?select=slug,name_en,name_sr,category:categories(slug)',
    ),
    restGet<Named[]>('tags?select=slug,name_en,name_sr'),
  ])
  if (rows.length === 0) throw new Error('No recipes: the E2E journeys need some.')

  const recipes = rows.map((row) => ({
    slug: row.slug,
    name_en: row.name_en,
    name_sr: row.name_sr,
    category: row.category,
    subcategory: row.subcategory,
    tagSlugs: row.recipe_tags.flatMap((rt) => (rt.tags ? [rt.tags.slug] : [])),
    ingredientNames: row.recipe_ingredients.flatMap((i) =>
      [i.name_en, i.name_sr].filter((n): n is string => !!n),
    ),
  }))
  const subcategories = subcategoryRows.map(({ category, ...rest }) => ({
    ...rest,
    categorySlug: category.slug,
  }))
  return { recipes, categories, subcategories, tags }
}

export function localized(item: Named, lang: Lang): string {
  return lang === 'sr' && item.name_sr ? item.name_sr : item.name_en
}

// The search contract (src/lib/diacritics.ts, written independently): š/č/ć/ž/đ match their
// plain stand-ins s/c/z/dj both ways, case-insensitively, in a recipe's names or its
// ingredients' names.
function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/š/g, 's')
    .replace(/[čć]/g, 'c')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'dj')
}

export function matchesSearch(recipe: Recipe, query: string): boolean {
  const q = fold(query.trim())
  return [recipe.name_en, recipe.name_sr ?? '', ...recipe.ingredientNames].some((text) =>
    fold(text).includes(q),
  )
}

// The value with the most recipes: a stable, well-populated pick for browse journeys.
export function mostCommon(values: (string | undefined | null)[]): {
  value: string
  count: number
} {
  const counts = new Map<string, number>()
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  const [value, count] = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]!
  return { value, count }
}

// UI copy, straight from the locale files.
type Messages = Record<string, unknown>
const messages: Record<Lang, Messages> = {
  sr: JSON.parse(readFileSync('src/locales/sr.json', 'utf8')) as Messages,
  en: JSON.parse(readFileSync('src/locales/en.json', 'utf8')) as Messages,
}

export function t(lang: Lang, key: string, count?: number): string {
  const lookup = (k: string) =>
    k
      .split('.')
      .reduce<unknown>((node, part) => (node as Messages | undefined)?.[part], messages[lang])
  let value = lookup(key)
  if (count !== undefined) {
    const form = new Intl.PluralRules(lang).select(count)
    value = lookup(`${key}_${form}`) ?? lookup(`${key}_other`)
  }
  if (typeof value !== 'string') throw new Error(`E2E: no "${key}" in ${lang}.json`)
  return value.replace('{{count}}', String(count))
}

import { useEffect, useState } from 'react'
import { expandDiacriticVariants } from '@/lib/diacritics'
import type { SupportedLanguage } from '@/lib/i18n'
import { pickPrimaryImage, type RawImageRow } from '@/lib/recipeQueries'
import { supabase } from '@/lib/supabaseClient'
import type { RecipeImageRef } from '@/types/recipe'

export interface AdminRecipeListItem {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  category: { slug: string; name_en: string; name_sr: string | null } | null
  subcategory: { slug: string; name_en: string; name_sr: string | null } | null
  image: RecipeImageRef | null
}

interface AdminRecipeRow {
  id: string
  slug: string
  name_en: string
  name_sr: string | null
  category: { slug: string; name_en: string; name_sr: string | null } | null
  subcategory: { slug: string; name_en: string; name_sr: string | null } | null
  images: RawImageRow[]
}

export type AdminRecipeSort = 'name' | 'rating' | 'recent'
export type SortDirection = 'asc' | 'desc'

export const ADMIN_RECIPES_PAGE_SIZE = 20

const FIXED_SORT_COLUMNS: Record<Exclude<AdminRecipeSort, 'name'>, string> = {
  rating: 'rating',
  recent: 'created_at',
}

interface UseAdminRecipesOptions {
  search: string
  sort: AdminRecipeSort
  sortDirection: SortDirection
  lang: SupportedLanguage
  page: number
  categoryId?: string | null
}

export function useAdminRecipes({ search, sort, sortDirection, lang, page, categoryId }: UseAdminRecipesOptions) {
  const [recipes, setRecipes] = useState<AdminRecipeListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      // "Name" sorts by whichever language is active in the UI rather than a
      // fixed column, so switching languages re-sorts the list accordingly.
      const column = sort === 'name' ? (lang === 'sr' ? 'name_sr' : 'name_en') : FIXED_SORT_COLUMNS[sort]
      const ascending = sortDirection === 'asc'
      const from = page * ADMIN_RECIPES_PAGE_SIZE
      const to = from + ADMIN_RECIPES_PAGE_SIZE - 1

      let query = supabase
        .from('recipes')
        .select(
          'id, slug, name_en, name_sr, category:categories(slug, name_en, name_sr), subcategory:subcategories(slug, name_en, name_sr), images:recipe_images(storage_path, alt_en, alt_sr, is_primary)',
          { count: 'exact' },
        )
        .order(column, { ascending })
        .range(from, to)

      // Commas are the PostgREST or-filter separator — strip them so search
      // text can't be mistaken for multiple conditions.
      const term = search.trim().replace(/,/g, '')
      if (term) {
        // Postgres `ilike` can't fold š/č/ć/đ/ž itself, so expand the typed
        // term into every accented/plain variant and OR them together —
        // lets "corba" match "čorba" and vice versa.
        const variants = expandDiacriticVariants(term)
        const conditions = variants.flatMap((variant) => [`name_en.ilike.%${variant}%`, `name_sr.ilike.%${variant}%`])
        query = query.or(conditions.join(','))
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error, count } = await query

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        const rows = (data ?? []) as unknown as AdminRecipeRow[]
        setRecipes(
          rows.map(({ images, ...rest }) => ({
            ...rest,
            image: pickPrimaryImage(images),
          })),
        )
        setTotal(count ?? 0)
        setError(null)
      }
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [search, sort, sortDirection, lang, page, categoryId, refetchToken])

  function refetch() {
    setRefetchToken((token) => token + 1)
  }

  return { recipes, total, isLoading, error, refetch, pageSize: ADMIN_RECIPES_PAGE_SIZE }
}

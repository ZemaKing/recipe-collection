import { describe, expect, it } from 'vitest'
import { filterAndSortRecipes } from './recipeFilter'
import type { SearchableRecipe } from '@/types/recipe'

function recipe(overrides: Partial<SearchableRecipe>): SearchableRecipe {
  return {
    id: overrides.id ?? Math.random().toString(),
    slug: 'recipe',
    name_en: 'Recipe',
    name_sr: null,
    prep_time_minutes: 10,
    cook_time_minutes: 10,
    rating: 0,
    is_favorite: false,
    category: null,
    image: null,
    created_at: '2024-01-01T00:00:00.000Z',
    ingredients: [],
    tagSlugs: [],
    ...overrides,
  }
}

describe('filterAndSortRecipes', () => {
  it('matches by English name (case-insensitive)', () => {
    const recipes = [recipe({ id: '1', name_en: 'Beef Goulash' }), recipe({ id: '2', name_en: 'Lemonade' })]
    const result = filterAndSortRecipes(recipes, { query: 'goulash' })
    expect(result.map((r) => r.id)).toEqual(['1'])
  })

  it('matches by Serbian name', () => {
    const recipes = [
      recipe({ id: '1', name_en: 'Beef Goulash', name_sr: 'Gulaš' }),
      recipe({ id: '2', name_en: 'Lemonade', name_sr: 'Limunada' }),
    ]
    const result = filterAndSortRecipes(recipes, { query: 'gulaš' })
    expect(result.map((r) => r.id)).toEqual(['1'])
  })

  it('matches by ingredient name in either language', () => {
    const recipes = [
      recipe({ id: '1', name_en: 'Salad', ingredients: [{ name_en: 'Cucumber', name_sr: 'Krastavac' }] }),
      recipe({ id: '2', name_en: 'Soup', ingredients: [{ name_en: 'Carrot', name_sr: 'Šargarepa' }] }),
    ]
    expect(filterAndSortRecipes(recipes, { query: 'krastavac' }).map((r) => r.id)).toEqual(['1'])
    expect(filterAndSortRecipes(recipes, { query: 'carrot' }).map((r) => r.id)).toEqual(['2'])
  })

  it('filters by category slug', () => {
    const recipes = [
      recipe({ id: '1', category: { slug: 'deserti', name_en: 'Desserts', name_sr: 'Deserti' } }),
      recipe({ id: '2', category: { slug: 'salate', name_en: 'Salads', name_sr: 'Salate' } }),
    ]
    const result = filterAndSortRecipes(recipes, { categorySlug: 'deserti' })
    expect(result.map((r) => r.id)).toEqual(['1'])
  })

  it('filters to favorites only', () => {
    const recipes = [recipe({ id: '1', is_favorite: true }), recipe({ id: '2', is_favorite: false })]
    const result = filterAndSortRecipes(recipes, { favoritesOnly: true })
    expect(result.map((r) => r.id)).toEqual(['1'])
  })

  it('requires a recipe to have every selected tag (AND, not OR)', () => {
    const recipes = [
      recipe({ id: '1', tagSlugs: ['brzi-recepti', 'vegetarijanski'] }),
      recipe({ id: '2', tagSlugs: ['brzi-recepti'] }),
      recipe({ id: '3', tagSlugs: [] }),
    ]
    const result = filterAndSortRecipes(recipes, { tagSlugs: ['brzi-recepti', 'vegetarijanski'] })
    expect(result.map((r) => r.id)).toEqual(['1'])
  })

  it('sorts by rating descending', () => {
    const recipes = [recipe({ id: '1', rating: 3 }), recipe({ id: '2', rating: 4.8 }), recipe({ id: '3', rating: 4 })]
    const result = filterAndSortRecipes(recipes, { sort: 'rating' })
    expect(result.map((r) => r.id)).toEqual(['2', '3', '1'])
  })

  it('sorts by total time ascending', () => {
    const recipes = [
      recipe({ id: '1', prep_time_minutes: 20, cook_time_minutes: 90 }),
      recipe({ id: '2', prep_time_minutes: 5, cook_time_minutes: 0 }),
      recipe({ id: '3', prep_time_minutes: 10, cook_time_minutes: 10 }),
    ]
    const result = filterAndSortRecipes(recipes, { sort: 'time' })
    expect(result.map((r) => r.id)).toEqual(['2', '3', '1'])
  })

  it('sorts by most recently created by default', () => {
    const recipes = [
      recipe({ id: '1', created_at: '2024-01-01T00:00:00.000Z' }),
      recipe({ id: '2', created_at: '2024-03-01T00:00:00.000Z' }),
      recipe({ id: '3', created_at: '2024-02-01T00:00:00.000Z' }),
    ]
    const result = filterAndSortRecipes(recipes)
    expect(result.map((r) => r.id)).toEqual(['2', '3', '1'])
  })

  it('combines search, category, favorites, and tag filters together', () => {
    const recipes = [
      recipe({
        id: '1',
        name_en: 'Shopska Salad',
        category: { slug: 'salate', name_en: 'Salads', name_sr: 'Salate' },
        is_favorite: true,
        tagSlugs: ['brzi-recepti'],
      }),
      recipe({
        id: '2',
        name_en: 'Shopska Salad clone',
        category: { slug: 'salate', name_en: 'Salads', name_sr: 'Salate' },
        is_favorite: false,
        tagSlugs: ['brzi-recepti'],
      }),
    ]
    const result = filterAndSortRecipes(recipes, {
      query: 'shopska',
      categorySlug: 'salate',
      favoritesOnly: true,
      tagSlugs: ['brzi-recepti'],
    })
    expect(result.map((r) => r.id)).toEqual(['1'])
  })

  it('returns an empty array when nothing matches', () => {
    const recipes = [recipe({ id: '1', name_en: 'Goulash' })]
    expect(filterAndSortRecipes(recipes, { query: 'nonexistent' })).toEqual([])
  })
})

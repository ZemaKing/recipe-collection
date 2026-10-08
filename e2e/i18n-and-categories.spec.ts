// Language switch (/sr/... ↔ /en/...) and the category pages. ROADMAP Phase 42.
import type { Page } from '@playwright/test'
import { expect, mainHeading, recipeCards, test } from './fixtures.ts'
import { localized, mostCommon, t, type Lang } from './support/data.ts'

async function switchLanguage(page: Page, from: Lang, to: Lang) {
  await page.getByRole('button', { name: t(from, 'topbar.language') }).click()
  await page.getByRole('menuitem', { name: t(to, `language.${to}`) }).click()
}

test('"/" redirects to a language, and an unknown language prefix is replaced', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(sr|en)$/)

  await page.goto('/xx/recepti')
  await expect(page).toHaveURL(/\/(sr|en)\/recepti$/)
})

test('switching language keeps the page and its filters, and translates it', async ({
  page,
  catalog,
}) => {
  const recipe = catalog.recipes.find((r) => r.name_sr && r.name_sr !== r.name_en)!

  await page.goto(`/sr/recepti/${recipe.slug}`)
  await expect(mainHeading(page)).toHaveText(recipe.name_sr!)
  await expect(page.locator('html')).toHaveAttribute('lang', 'sr')

  await switchLanguage(page, 'sr', 'en')
  await expect(page).toHaveURL(`/en/recepti/${recipe.slug}`)
  await expect(mainHeading(page)).toHaveText(recipe.name_en)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  // Query string survives the switch.
  const category = catalog.categories.find((c) => c.name_sr && c.name_sr !== c.name_en)!
  await page.goto(`/en/recepti?category=${category.slug}`)
  await expect(
    page.locator('main').getByRole('button', { name: localized(category, 'en'), exact: true }),
  ).toBeVisible()

  await switchLanguage(page, 'en', 'sr')
  await expect(page).toHaveURL(`/sr/recepti?category=${category.slug}`)
  await expect(
    page.locator('main').getByRole('button', { name: localized(category, 'sr'), exact: true }),
  ).toBeVisible()
  await expect(mainHeading(page)).toContainText(t('sr', 'allRecipesPage.title'))
})

test('categories index → category → subcategory, with matching counts', async ({
  page,
  catalog,
}) => {
  const { recipes, categories } = catalog
  const top = mostCommon(recipes.map((r) => r.category?.slug))
  const category = categories.find((c) => c.slug === top.value)!

  await page.goto('/sr/kategorije')
  await expect(mainHeading(page)).toHaveText(t('sr', 'categoriesPage.title'))
  await expect(
    page.getByText(`${t('sr', 'common.categoryCount', categories.length)} · `),
  ).toBeVisible()
  const tiles = page.locator('main a[href^="/sr/kategorije/"]')
  await expect(tiles).toHaveCount(categories.length)

  await tiles.filter({ hasText: localized(category, 'sr') }).click()
  await expect(page).toHaveURL(`/sr/kategorije/${category.slug}`)
  await expect(mainHeading(page)).toHaveText(localized(category, 'sr'))
  await expect(
    page.locator('main').getByText(t('sr', 'common.recipeCount', top.count), { exact: true }),
  ).toBeVisible()
  await expect(recipeCards(page)).toHaveCount(top.count)

  // Only subcategories that have recipes get a chip.
  const inCategory = recipes.filter((r) => r.category?.slug === category.slug)
  const sub = mostCommon(inCategory.map((r) => r.subcategory?.slug))
  const subcategory = catalog.subcategories.find((s) => s.slug === sub.value)!
  const withRecipes = new Set(inCategory.map((r) => r.subcategory?.slug).filter(Boolean))
  await expect(page.locator(`main a[href^="/sr/kategorije/${category.slug}/"]`)).toHaveCount(
    withRecipes.size,
  )

  await page
    .locator('main')
    .getByRole('link', { name: localized(subcategory, 'sr'), exact: true })
    .click()
  await expect(page).toHaveURL(`/sr/kategorije/${category.slug}/${subcategory.slug}`)
  await expect(recipeCards(page)).toHaveCount(sub.count)

  await page.goto('/sr/kategorije/no-such-category-e2e')
  await expect(page.getByText(t('sr', 'categoryDetailPage.notFoundTitle'))).toBeVisible()
})

test('unknown paths show the 404 page (noindex) with a way home', async ({ page }) => {
  const response = await page.goto('/en/no-such-page-e2e')
  expect(response?.status()).toBe(200) // SPA fallback; the 404 is rendered client-side
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  await expect(mainHeading(page)).toBeVisible()
})

test('the admin area is closed to visitors', async ({ page }) => {
  await page.goto('/en/admin/recepti')
  await expect(page).toHaveURL(/\/en\/prijava/)
})

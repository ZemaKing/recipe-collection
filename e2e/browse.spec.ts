// Home → /recepti → search (incl. diacritics) → filters (category, subcategory, tags,
// favourites) → recipe detail. ROADMAP Phase 42. Runs at desktop and mobile widths.
import type { Page } from '@playwright/test'
import { expect, mainHeading, recipeCards, test } from './fixtures.ts'
import { localized, matchesSearch, mostCommon, t, type Recipe } from './support/data.ts'

const count = (recipes: Recipe[], keep: (r: Recipe) => boolean) => recipes.filter(keep).length

// The header search box; on a phone it sits behind the Search button.
async function search(page: Page, isMobile: boolean, text: string) {
  if (isMobile) await page.getByRole('button', { name: t('en', 'topbar.search') }).click()
  await page.getByRole('searchbox').fill(text)
}

// The /recepti filter dropdowns (Radix menus): open by the trigger's current label, pick an item.
async function pick(page: Page, trigger: string, item: string) {
  await page.locator('main').getByRole('button', { name: trigger, exact: true }).click()
  await page.getByRole('menuitem', { name: item, exact: true }).click()
}

async function toggleTag(page: Page, isMobile: boolean, label: string) {
  // Desktop: the sidebar's quick filters. Phone: the tag chips on /recepti.
  const scope = isMobile ? page.locator('main') : page.locator('aside')
  await scope.getByRole('button', { name: label }).first().click()
}

test('home lists the recipe count and "See all" opens every recipe', async ({ page, catalog }) => {
  const total = catalog.recipes.length
  await page.goto('/en')
  await expect(
    page.getByRole('button', { name: `${t('en', 'nav.allRecipes')} (${total})` }),
  ).toBeVisible()
  await expect(recipeCards(page).first()).toBeVisible()

  await page.getByRole('link', { name: t('en', 'home.seeAll') }).click()
  await expect(page).toHaveURL('/en/recepti')
  await expect(mainHeading(page)).toHaveText(`${t('en', 'allRecipesPage.title')} (${total})`)
  await expect(recipeCards(page)).toHaveCount(total)
})

test('search ignores diacritics both ways and matches ingredients', async ({
  page,
  catalog,
  isMobile,
}) => {
  // For each Serbian letter the data has, a recipe-name word containing it, typed both without
  // the diacritic and in capitals with it: the same recipes either way.
  const words = catalog.recipes.flatMap((r) => (r.name_sr ?? '').split(/[\s,-]+/))
  const samples = ['č', 'ć', 'š', 'ž', 'đ'].flatMap((letter) => {
    const word = words.find((w) => w.length >= 4 && w.toLowerCase().includes(letter))
    return word ? [word.toLowerCase()] : []
  })
  expect(samples.length, 'recipe names with at least 3 of č ć š ž đ').toBeGreaterThanOrEqual(3)

  await page.goto('/en')
  for (const [i, word] of samples.entries()) {
    const plain = word.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj')
    const expected = count(catalog.recipes, (r) => matchesSearch(r, plain))
    if (i === 0) {
      // From the home page the header search opens /recepti with the query.
      await search(page, isMobile, plain)
      await expect(page).toHaveURL(`/en/recepti?q=${plain}`)
    } else {
      await page.getByRole('searchbox').fill(plain)
    }
    await expect(recipeCards(page), `"${plain}"`).toHaveCount(expected)
    await page.getByRole('searchbox').fill(word.toUpperCase())
    await expect(recipeCards(page), `"${word.toUpperCase()}"`).toHaveCount(expected)
  }

  // An ingredient word that's in no recipe's name still finds the recipes that use it.
  const ingredientWord = catalog.recipes
    .flatMap((r) => r.ingredientNames.flatMap((name) => name.split(/\s+/)))
    .find(
      (word) =>
        word.length >= 5 &&
        !catalog.recipes.some((r) => matchesSearch({ ...r, ingredientNames: [] }, word)),
    )
  expect(ingredientWord, 'an ingredient word that no recipe name contains').toBeDefined()
  await page.getByRole('searchbox').fill(ingredientWord!)
  await expect(recipeCards(page)).toHaveCount(
    count(catalog.recipes, (r) => matchesSearch(r, ingredientWord!)),
  )

  await page.getByRole('searchbox').fill('zzz-no-such-recipe')
  await expect(page.getByText(t('en', 'browse.noResults.title'))).toBeVisible()
  await expect(recipeCards(page)).toHaveCount(0)
})

test('category, subcategory and tag filters narrow the list (tags AND-ed), Clear resets', async ({
  page,
  catalog,
  isMobile,
}) => {
  const { recipes } = catalog
  const category = catalog.categories.find(
    (c) => c.slug === mostCommon(recipes.map((r) => r.category?.slug)).value,
  )!
  const inCategory = recipes.filter((r) => r.category?.slug === category.slug)
  const subcategory = catalog.subcategories.find(
    (s) => s.slug === mostCommon(inCategory.map((r) => r.subcategory?.slug)).value,
  )!
  const inSubcategory = inCategory.filter((r) => r.subcategory?.slug === subcategory.slug)
  const tag = catalog.tags.find(
    (tg) => tg.slug === mostCommon(inSubcategory.flatMap((r) => r.tagSlugs)).value,
  )!

  await page.goto('/en/recepti')
  await expect(recipeCards(page)).toHaveCount(recipes.length)

  await pick(page, t('en', 'browse.categoryAll'), localized(category, 'en'))
  await expect(page).toHaveURL(`/en/recepti?category=${category.slug}`)
  await expect(recipeCards(page)).toHaveCount(inCategory.length)

  await pick(page, t('en', 'browse.subcategoryAll'), localized(subcategory, 'en'))
  await expect(page).toHaveURL(new RegExp(`subcategory=${subcategory.slug}`))
  await expect(recipeCards(page)).toHaveCount(inSubcategory.length)

  await toggleTag(page, isMobile, localized(tag, 'en'))
  await expect(page).toHaveURL(new RegExp(`tags=${tag.slug}`))
  const withTag = inSubcategory.filter((r) => r.tagSlugs.includes(tag.slug))
  await expect(recipeCards(page)).toHaveCount(withTag.length)

  // A second tag must be carried by the same recipes too (AND, not OR).
  const second = catalog.tags.find((tg) => tg.slug !== tag.slug)!
  await toggleTag(page, isMobile, localized(second, 'en'))
  await expect(page).toHaveURL(new RegExp(`tags=${tag.slug}%2C${second.slug}`))
  const withBoth = withTag.filter((r) => r.tagSlugs.includes(second.slug))
  await expect(recipeCards(page)).toHaveCount(withBoth.length)

  // Changing the category drops the subcategory.
  await pick(page, localized(category, 'en'), t('en', 'browse.categoryAll'))
  await expect(page).not.toHaveURL(/subcategory=/)

  await page.getByRole('button', { name: t('en', 'browse.clearFilters') }).click()
  await expect(page).toHaveURL('/en/recepti')
  await expect(recipeCards(page)).toHaveCount(recipes.length)
})

test("a visitor's hearts stay in this browser and drive the favourites filter", async ({
  page,
}) => {
  await page.goto('/en/recepti')
  const favoritesOnly = page.getByRole('button', { name: t('en', 'browse.favoritesOnly') })

  // A fresh browser has no favourites (the owner's hearts aren't the visitor's).
  await favoritesOnly.click()
  await expect(page).toHaveURL('/en/recepti?favorite=1')
  await expect(page.getByText(t('en', 'browse.noResults.title'))).toBeVisible()
  await favoritesOnly.click()

  const firstCard = recipeCards(page).first()
  const slug = (await firstCard.getAttribute('href'))!.split('/').pop()!
  const heart = firstCard.getByRole('button', { name: t('en', 'recipeDetail.addFavorite') })
  await heart.click()
  // The heart is inside the card's link: toggling it must not navigate.
  await expect(page).toHaveURL('/en/recepti')
  await expect(
    firstCard.getByRole('button', { name: t('en', 'recipeDetail.removeFavorite') }),
  ).toHaveAttribute('aria-pressed', 'true')

  await favoritesOnly.click()
  await expect(recipeCards(page)).toHaveCount(1)
  await expect(recipeCards(page).first()).toHaveAttribute('href', `/en/recepti/${slug}`)

  // Kept across a reload and shown on the favourites page (the read-only guard proves no write).
  await page.goto('/en/omiljeni')
  await expect(recipeCards(page)).toHaveCount(1)
  await expect(recipeCards(page).first()).toHaveAttribute('href', `/en/recepti/${slug}`)
})

test('a card opens its recipe; an unknown slug says not found', async ({ page, catalog }) => {
  await page.goto('/en/recepti')
  const card = recipeCards(page).first()
  const slug = (await card.getAttribute('href'))!.split('/').pop()!
  const recipe = catalog.recipes.find((r) => r.slug === slug)!

  await card.click()
  await expect(page).toHaveURL(`/en/recepti/${slug}`)
  await expect(mainHeading(page)).toHaveText(localized(recipe, 'en'))
  await expect(page.getByText(t('en', 'recipeDetail.ingredients.title')).first()).toBeVisible()

  await page.goto('/en/recepti/no-such-recipe-e2e')
  await expect(page.getByText(t('en', 'recipeDetail.notFoundTitle'))).toBeVisible()
})

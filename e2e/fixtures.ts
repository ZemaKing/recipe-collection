// Shared Playwright fixtures for the E2E suite (ROADMAP Phase 42).
//
// Every test gets two automatic guards:
//   - read-only: any non-GET/HEAD request from the page to Supabase is aborted and fails the test
//     (the suite runs against the live project, Open decision 4, so nothing here may ever write);
//   - no uncaught page errors and no CSP violations (the build is served with production's CSP).
// And `catalog`: the recipes, categories, subcategories and tags fetched straight from the REST
// API with the anon key, an oracle independent of the app's own filter code.
import { test as base, expect, type Page } from '@playwright/test'
import { fetchCatalog, type Catalog } from './support/data.ts'
import { supabaseOrigin } from './support/env.ts'

type Fixtures = {
  guards: void
}
type WorkerFixtures = {
  catalog: Catalog
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  catalog: [
    // eslint-disable-next-line no-empty-pattern -- Playwright reads the fixture deps from this destructuring
    async ({}, use) => {
      await use(await fetchCatalog())
    },
    { scope: 'worker' },
  ],

  guards: [
    async ({ page }, use) => {
      const blocked: string[] = []
      const pageErrors: string[] = []

      await page.route(`${supabaseOrigin()}/**`, async (route) => {
        const request = route.request()
        // OPTIONS: CORS preflights for the GETs (supabase-js sends custom headers).
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue()
        blocked.push(`${request.method()} ${request.url()}`)
        return route.abort('blockedbyclient')
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
          pageErrors.push(message.text())
        }
      })

      await use()

      expect(
        blocked,
        'the E2E suite is read-only: these requests to Supabase were blocked',
      ).toEqual([])
      expect(pageErrors, 'uncaught errors / CSP violations in the page').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

// Recipe cards in the page's main region (each card is one link to /:lang/recepti/:slug).
export function recipeCards(page: Page) {
  return page.locator('main a[href*="/recepti/"]')
}

// The page's own heading (the desktop top bar has an <h1> with the app name too).
export function mainHeading(page: Page) {
  return page.locator('main h1')
}

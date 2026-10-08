// End-to-end tests (ROADMAP Phase 42): `npm run test:e2e`. See e2e/README.md.
//
// READ-ONLY (Open decision 4): the suite runs the production build against the Supabase project in
// .env.local, i.e. the live recipes, and never writes. e2e/fixtures.ts fails any test whose page
// sends a non-GET request to Supabase, so a write can't slip in. Admin flows are a manual
// checklist (e2e/README.md). Same setup as the diecast app's suite.
//
// Browser: the locally installed Microsoft Edge (`channel: 'msedge'`, like scripts/lib/headless.mjs),
// so there's no Playwright browser download. E2E_CHANNEL=chrome to use Chrome instead.
//
// E2E_BASE_URL=https://… runs the same suite against a deployed site (a Vercel preview, or
// production) instead of a local build. It must use the same Supabase project as .env.local,
// since the expected values are read from it.
import { defineConfig, devices } from '@playwright/test'

const PORT = 4174 // not 4173, so a hand-started `npm run preview` of an older build is never reused
const channel = process.env.E2E_CHANNEL ?? 'msedge'
const deployedUrl = process.env.E2E_BASE_URL?.trim().replace(/\/+$/, '')

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries: a flaky test should show up as flaky, not be hidden. Every failure keeps a trace.
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: deployedUrl ?? `http://localhost:${PORT}`,
    channel,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  projects: [
    // lg+: sidebar with categories and the tag quick filters, header search box.
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1280, height: 900 } },
    },
    // < md: bottom tab bar, search behind a button, tag chips on /recepti.
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: deployedUrl
    ? undefined
    : {
        // Always a fresh production build (postbuild checks included), served with
        // production's headers and CSP (vite.config.ts) — what visitors get.
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})

# End-to-end tests (ROADMAP Phase 42)

```bash
npm run test:e2e                                  # build + preview on :4174, then every journey, desktop + mobile
npx playwright test e2e/browse.spec.ts            # one file
npx playwright test -g "language" --project=mobile # by name, one viewport
npm run test:e2e:report                           # HTML report of the last run
```

**Read-only by design (Open decision 4).** There's no separate Supabase test project (the org's
two free slots are taken), so the suite runs the production build against the project in
`.env.local`, i.e. the live recipes, and **never writes**. `fixtures.ts` aborts every
non-GET/HEAD request from the page to Supabase and fails the test that sent it. It also fails a
test on an uncaught page error or a CSP violation (the build is served with production's
headers). Nothing here signs in.

- **Expected values** come from `support/data.ts`, which reads recipes, categories,
  subcategories and tags straight from PostgREST with the anon key. It doesn't use `src/lib`, so
  a bug in the app's filtering can't also shift what the tests expect, and adding a recipe never
  breaks the suite. UI copy comes from `src/locales/{sr,en}.json`.
- **Browser:** the installed Microsoft Edge (`channel: 'msedge'`), so no Playwright browser
  download. `E2E_CHANNEL=chrome` uses Chrome instead.
- **Projects:** `desktop` (1280×900: sidebar, tag quick filters, header search) and `mobile`
  (Pixel 7: bottom tab bar, search button, tag chips on `/recepti`). Every test runs on both.
- **Failures** keep a trace, a screenshot and the page's accessibility tree in
  `test-results/e2e/<test>/` (`npx playwright show-trace …/trace.zip`). No retries, so a flaky
  test shows up instead of being hidden.
- **Against a deployed site:** `E2E_BASE_URL=https://… npm run test:e2e` (PowerShell:
  `$env:E2E_BASE_URL="https://…"; npm run test:e2e`) skips the local build and tests that URL, e.g.
  a Vercel preview before promoting it. It must use the same Supabase project as `.env.local`.
- **Not in CI:** it needs the live project and Edge. CI (`.github/workflows/ci.yml`) runs lint,
  typecheck, unit tests and the build.

| File | Covers |
| --- | --- |
| `browse.spec.ts` | home count + "See all" → `/recepti`; header search → `?q=`, diacritics both ways (č ć š ž đ from the live names), ingredient matches, no-results; category → subcategory → tags (AND) → category change drops the subcategory → Clear; visitor favourites (localStorage, no write) → favourites filter + `/omiljeni`; card → detail; unknown recipe |
| `i18n-and-categories.spec.ts` | `/` and unknown-language redirects; language switch `/sr/…` ↔ `/en/…` keeps path + query, translates, sets `<html lang>`; categories index → category → subcategory chips with counts; unknown category; 404 + `noindex`; `/admin` → login |

## Admin flows: manual checklist

Not automated (they need writes). `npm run verify:rls` covers the permission side with
throw-away fixtures; the UI side is checked by hand, signed in as the admin, before a release:

- [ ] Sign in at `/sr/prijava`; `/sr/admin/recepti` lists every recipe (table and cards)
- [ ] Create a recipe (ingredients, steps, category, subcategory, tags, difficulty), then check it on the public detail page in sr and en
- [ ] Edit it; add a photo (stored as `.webp`, card shows the `.card.webp`), replace it, set primary, reorder, remove
- [ ] JSON/AI import fills the form
- [ ] Ingredients: create, edit, photo upload/replace/remove, delete
- [ ] Categories, subcategories and tags: create, rename, delete
- [ ] Kitchen note and meal-plan entry: create, edit, delete
- [ ] A heart toggled as the admin survives a reload and shows on `/sr/omiljeni` (it writes `recipes.is_favorite`; visitors keep their own)
- [ ] Delete the test recipe; sign out

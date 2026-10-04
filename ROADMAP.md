# Recipe Collection — Images, Security & Hardening Roadmap

Follow-up to the build log in [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md). Its finished phases were cleared from that file (commit `c2232b1`); only the unscheduled **Phase 32 — Postgres Full-Text Search** remains there, and it stays deferred (see the end of this file). Numbering continues at **33**. Once this roadmap is approved it becomes the live tracker (update `CLAUDE.md` in Phase 33).

The image pipeline reuses the one built for the diecast app (`../diecast-collection/scripts/images/` + `src/lib/image-resize.ts`). That code was written app-agnostic so it could be reused here (diecast ROADMAP Phase 21). Its README even uses "recipe photos" as the example job.

**Status: nothing started.** Research done 2026-10-04 (findings below).

---

## Findings (measured 2026-10-04)

All numbers come from the live project: public anon reads of `recipes`, `recipe_images` and `ingredients`, plus Storage `HEAD`s of all 131 objects. Samples (20 recipe photos, 15 ingredient photos) were downloaded and converted with `sharp` to measure WebP sizes. Nothing was written.

### Images — the main problem

| What | `recipe-images` (recipe photos) | `ingredient-images` (catalog) |
| --- | --- | --- |
| Rows | 62 recipes, 62 images (1 per recipe today) | 292 ingredients, 69 with a photo |
| Formats | **42 PNG (61.2 MB, avg 1.49 MB, max 2.9 MB)** · 20 JPEG (17.9 MB, avg 916 KB) | **69 PNG** (4.5 MB, avg 67 KB), all with transparency |
| Total | **79.1 MB** | 4.5 MB |
| Dimensions | 900×600 · 1200×800 · 1536×1024 (max 1536 wide) | all 300×200 |
| WebP, measured on samples | avg **1,227 KB → 154 KB (−87 %)** at full size · 600 px card ≈ 40–78 KB · 400 px ≈ 24 KB | 70 KB → **12 KB (−81 %)**, transparency kept |
| Orphaned objects | 0 | 0 |

Root causes in code:
- `src/lib/storage.ts` → `resizeImageIfNeeded()` **returns PNGs untouched** (`if (file.type === 'image/png') return file`) and only downscales JPEG/WebP above 2000 px. It never converts to WebP. The PNGs are mostly AI-generated or exported dish images, which is why they're 1.5 MB each.
- **There are no thumbnails.** `RecipeImage` renders the full file in `RecipeCard` (grids on home, `/recepti`, categories, favourites, recently added), in the admin list and in the detail hero. The same goes for `IngredientImage`.
- Objects are uploaded with `cacheControl: '3600'`, but paths are UUIDs that never change, so they could be cached for a year.
- The buckets have **no** `file_size_limit` / `allowed_mime_types` (the limits live only in client code). Their write policies are `to authenticated` (any user), and their public `SELECT` policies let anyone list every object.

**What this costs:** Supabase Free quotas are **per organization**: 1 GB Storage and 5 GB egress a month. This org is shared with the game-collection project, which alone holds ≈ 2.0 GB, so the org is at **≈ 2.1 GB of 1 GB**. That means uploads here can be blocked too. A grid of 20 recipe cards ≈ 20 × 1.3 MB ≈ **26 MB** of images; with WebP thumbnails it's ≈ 1 MB.

**Target after this roadmap:** 62 × (154 KB + ~45 KB) + 69 × 12 KB ≈ **13 MB** (from 84 MB, −85 %).

### Security & privacy — urgent

- **Sign-ups are enabled.** `GET /auth/v1/settings` returns `disable_signup: false` (email confirmation is on).
- **Every write policy is `for all to authenticated using (true)`**, on all tables and both buckets. So anyone who registers and confirms an email can **edit or delete every recipe, ingredient, note and photo**. `CLAUDE.md` calls it "single-admin auth", but the database enforces "any signed-in user". Nothing was tested by signing up; this comes from the public settings and the migrations.
- **`kitchen_notes` and `meal_plan_entries` are publicly readable** (`*_public_select` policies). The anon key counts 2 notes and 8 meal-plan entries, even though the UI shows them only under `/admin`. That may be intended; it's Open decision 2.
- **Favourites:** `FavoriteButton` appears on every recipe card and hero for public visitors, but `is_favorite` is a column on `recipes` that only an authenticated user can update. A visitor's click toggles optimistically and then silently reverts (`useAllRecipes.toggleFavorite`). Open decision 3.

### Health

- `npm ci` · `npm run lint` ✅ · `npm test` ✅ **104 tests / 12 files** · `npm run build` ✅. Largest chunks: `index` 120 kB gzip, `Combination` 68 kB, `localizedField` 55 kB, `CategorySelect` 30 kB (`react-select`), `clipboard` 25 kB.
- **No CI.** There's no `.github/workflows`.
- `vercel.json` only has the SPA rewrite. It sets no security headers and no `immutable` caching for `/assets/*` (the game app has both).
- **Docs are stale.** `CLAUDE.md` doesn't mention the ingredient catalog, nutrition (vitamins/minerals), meal plan, kitchen notes, JSON/AI import, subcategories or difficulties. `README.md` is 2 lines. Every migration file has a matching table, so there is no schema drift.
- Data: each hook fetches on mount; there's no shared cache. `/recepti` loads the whole recipe table (fine at 62; Phase 32 FTS covers the large-scale case).

---

## Workflow rules

1. **One phase at a time.** Never continue into the next phase without explicit approval.
2. At the end of every phase, report: (1) what changed, (2) files added, (3) files modified, (4) DB migrations, (5) manual actions required from the owner, (6) test/build/lint status, (7) roadmap updated. Then **STOP**.
3. **No image is deleted from Storage until its WebP replacement is verified *and* a local backup with checksums exists.** Deleting originals is its own phase (39) and needs explicit approval.
4. Schema changes go in new timestamped files in `supabase/migrations/`, applied by the owner in the dashboard SQL editor.
5. New dependencies need a one-line justification in the phase report.
6. A service-role key never enters frontend code, a `VITE_*` variable, or git.
7. Every new UI string goes in `src/locales/sr.json` **and** `en.json`; every new route keeps the `:lang` prefix and the localized segments (`buildLocalizedPath`).
8. **Egress budget:** any script that downloads whole buckets prints the bytes first and asks. The org's 5 GB/month is shared with the game app.

## Global Definition of Done

- `npm run lint`, `npm test` and `npm run build` pass (CI from Phase 42 on); no new warnings.
- UI phases: checked at desktop, tablet and mobile widths, light and dark, `sr` and `en`.
- Pure logic has co-located Vitest tests.
- `ROADMAP.md` checkboxes and the status table are updated.

## Architecture target (images)

```
Upload (browser):  File ─► image-resize.ts (canvas → WebP) ─► Storage ─► recipe_images {storage_path, thumb_path, width, height}
                                                                       ─► ingredients {image_storage_path}  (single 300×200-class variant)
Read:              RecipeCard / admin lists ─► thumb_path ?? storage_path      detail hero ─► storage_path
Existing files:    scripts/images (sharp) ─► WebP at new paths ─► verify ─► flip rows in one transaction ─► (later) delete originals
```

- **Recipe variants:** `full` fits inside 1600×1600, q82 (all current originals are ≤ 1536 px, so this is a re-encode, not a resize). `thumb` fits inside 600×600, q75: cards are `aspect-square` at ≤ ~300 CSS px, so 600 covers 2× screens.
- **Ingredient photo:** one WebP that fits inside 600×400, q80, with alpha kept. Today's are 300×200, so they keep their size; uploads larger than that are downscaled. No thumb is needed.
- **Paths:** `{recipe_id}/{uuid}.webp` + `{uuid}.thumb.webp`; `{ingredient_id}/{uuid}.webp`. New photo = new UUID, so `Cache-Control: max-age=31536000, immutable`.
- **Rollback columns:** `original_path` (recipes) / `image_original_path` (ingredients) until Phase 39.

## Status

| # | Phase | Status | Needs from owner |
| --- | --- | --- | --- |
| 33 | Security & Privacy Lockdown | ⬜ Not started | Disable sign-ups (1 min); decisions 2–3; apply migration |
| 34 | Image Audit & Local Backup | ⬜ Not started | Service-role key in `.env.local`; check the Usage page |
| 35 | Image Pipeline Port & Schema | ⬜ Not started | Apply migration |
| 36 | WebP Migration of Existing Images | ⬜ Not started | Run the scripts |
| 37 | Read Path: Thumbnails & Loading Priority | ⬜ Not started | — |
| 38 | Upload Path: WebP in the Browser | ⬜ Not started | Upload a test photo by hand |
| 39 | Retire Originals | ⬜ Not started | **Explicit approval to delete ~84 MB of originals** |
| 40 | Data Layer & Performance | ⬜ Not started | — |
| 41 | Deployment Hardening | ⬜ Not started | — |
| 42 | Quality Gates (CI & E2E) | ⬜ Not started | Make CI a required check (GitHub setting) |
| 43 | Docs, Backup & Production Verification | ⬜ Not started | Go/no-go |

---

## Phase 33 — Security & Privacy Lockdown

### Goal
Only the owner can write; only intended data is public. Comes first because today any registered user can change everything.

### Tasks
- [ ] **Owner, now:** Dashboard → Authentication → turn off "Allow new users to sign up"; check the Users list for unknown accounts
- [ ] Migration: `admin_users (user_id uuid primary key references auth.users)`, with RLS on and no API grants, plus `is_admin()` (`security definer`, `stable`, `search_path` pinned)
- [ ] Migration: every `*_authenticated_write` policy → `using (is_admin()) with check (is_admin())`, on all 16 tables (recipes, steps, ingredients, recipe_ingredients, categories, subcategories, tags, recipe_tags, recipe_images, ingredient catalog + vitamins/minerals + link tables, ingredient_categories, kitchen_notes, meal_plan_entries)
- [ ] Storage, both buckets: writes only for `is_admin()`; drop the public `SELECT` (listing) policies, which public URLs don't need. **Note:** `deleteRecipeImageFolder` / `deleteIngredientImageFolder` list the folder, so give the admin a `SELECT` policy. Set `file_size_limit` and `allowed_mime_types` on the buckets
- [ ] Per Open decision 2: make `kitchen_notes` and `meal_plan_entries` admin-read-only (and check the public pages don't query them)
- [ ] Per Open decision 3: favourites become either admin-only (button hidden for visitors) or a per-visitor localStorage preference
- [ ] `scripts/verify-rls.mjs` (`npm run verify:rls`): checks as anon and as a signed-in non-admin (`RLS_*` logins in `.env.local`) that public reads work, private tables are refused, every write/upload/list is refused, and the admin can write (self-cleaning fixtures)
- [ ] Point `CLAUDE.md` at this roadmap

### Verification
- [ ] `/auth/v1/settings` → `disable_signup: true`
- [ ] `verify:rls` green; the owner can still create/edit/delete a recipe, an ingredient, a photo, a note and a meal-plan entry
- [ ] As a visitor, the favourite button does what decision 3 says (no silent revert)

### Definition of Done
Writes require `is_admin()`, sign-ups are off, private data isn't public, and a script proves it.

---

## Phase 34 — Image Audit & Local Backup

### Goal
One checksummed copy of every original (84 MB) before anything changes. That copy is also the conversion source.

### Tasks
- [ ] Owner: Dashboard → Organization → Usage. Record Storage size, this month's egress, whether uploads are restricted, and the cycle reset date (shared with the game app; → Open decision 1)
- [ ] Owner: `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] `scripts/images-audit.ts` (`npm run images:audit`): rows vs objects for both buckets, bytes by format, orphans, duplicates (HEADs only) → `docs/images-audit.md`
- [ ] `scripts/images-backup.ts` (`npm run images:backup -- --apply`): both buckets → git-ignored `backups/images/{bucket}/…` + `manifest.json` (bytes, sha256, dims, type); resumable
- [ ] DB export (`pg_dump` or CSV per table) → `backups/db/`, procedure in `docs/backup.md`; owner copies both to a second place

### Verification
- [ ] Audit matches the findings: 62 + 69 objects, ≈ 84 MB, 0 orphans; a re-run of the backup downloads 0 bytes

### Definition of Done
Verified local copy of every image + DB export, in two places.

---

## Phase 35 — Image Pipeline Port & Schema

### Goal
Bring in the diecast converter and add variant columns. No row changes yet.

### Tasks
- [ ] Copy `scripts/images/` from diecast with its tests. Dev dependencies: **`sharp`** (WebP encoding, scripts only), **`tsx`** (runs TS scripts)
- [ ] Local source support: read originals from `backups/images/` (Phase 34) instead of URLs, so the migration needs no download egress (the same change as the game app's; keep the copies in step)
- [ ] Migration: `recipe_images` add `thumb_path`, `width`, `height`, `original_path`; `ingredients` add `image_width`, `image_height`, `image_original_path`. Update `src/types/recipe.ts` / `ingredient.ts`, the `SEARCHABLE_RECIPE_SELECT` / summary selects and `mapRecipeSummaryRow`
- [ ] Two jobs in `scripts/migrate-images/`: `recipe-job.ts` (full + thumb) and `ingredient-job.ts` (one variant), as described in the architecture target
- [ ] `tsconfig.scripts.json` so `tsc -b` covers `scripts/`; npm scripts `images:migrate`, `images:check`

### Verification
- [ ] Dry run over all 131 images: 0 failures; expected ≈ 84 MB → ≈ 13 MB
- [ ] App unchanged with the new nullable columns

### Definition of Done
Pipeline and schema ready; no user-visible change.

---

## Phase 36 — WebP Migration of Existing Images

### Goal
Upload WebP for every recipe and ingredient photo, verify, and switch rows in one transaction with a tested rollback.

### Tasks
- [ ] `images:migrate -- --limit=5 --apply`, check, then the rest (both jobs). If uploads are blocked by the org quota, follow Open decision 1
- [ ] `images:check -- --full` (small enough here to sha256-check everything: ~13 MB)
- [ ] DB functions `set_recipe_image_variants(jsonb)` / `set_ingredient_image_variants(jsonb)` (service role only, one transaction): move the current path to `original_path`, set the WebP paths and dims. They refuse if any row's current path isn't the one in the manifest
- [ ] `images:flip` (dry run default, `--apply`, `--rollback`)
- [ ] Commit the manifests

### Verification
- [ ] 62/62 recipe rows and 69/69 ingredient rows serve `image/webp`; the rollback was exercised once
- [ ] Browser: home, `/recepti`, a category, a recipe detail, admin recipes and ingredients, in both languages; ingredient transparency intact on light and dark

### Definition of Done
All images served as WebP; originals untouched in Storage and backed up.

---

## Phase 37 — Read Path: Thumbnails & Loading Priority

### Goal
Cards load thumbnails; the detail hero loads the full image first.

### Tasks
- [ ] `storage.ts`: `getRecipeImageUrls(image) → { full, thumb }` (`thumb_path ?? storage_path`), unit-tested
- [ ] `RecipeImage` gets `variant` (default `thumb`): **thumb** for `RecipeCard` (every grid), `AdminRecipesPage` table + cards, `ImageManager` tiles; **full** for `ImageGallery` / `RecipeDetailHero`
- [ ] `width`/`height` on `<img>` when known; the detail hero keeps `loading="eager"` + `fetchpriority="high"`; the first row of cards on home and `/recepti` loads eager, the rest lazy
- [ ] `IngredientImage` uses the stored dimensions

### Verification
- [ ] Network: `/recepti` with all 62 recipes transfers ≲ 3 MB of images (was ≈ 80 MB if scrolled through); no `full` request on list pages
- [ ] No visible blur on a 2× screen; no layout shift while cards load

### Definition of Done
No list view downloads a full-size recipe photo.

---

## Phase 38 — Upload Path: WebP in the Browser

### Goal
New uploads are stored as small WebP files, PNGs included.

### Tasks
- [ ] Copy diecast `src/lib/image-resize.ts` (no imports; EXIF-aware decode, step-down resize, `OffscreenCanvas` + fallback, WebP with a PNG fallback)
- [ ] Replace `resizeImageIfNeeded()`. **Remove the PNG skip.** Every input → WebP (`full` + `thumb` for recipes, one variant for ingredients); `cacheControl` one year
- [ ] `useRecipeImages.addImage` / `replaceImage` / `removeImage` and `useIngredientImage.setImageFile` / `removeImage` write and delete **both** variants and clean up on failure
- [ ] The input size limit can go up (only the output is stored); bucket `allowed_mime_types` → WebP (+ PNG fallback)
- [ ] The JSON/AI recipe import paths that attach images (if any) use the same function

### Verification
- [ ] Owner uploads a 1.5 MB PNG dish photo → ≈ 150 KB + ≈ 45 KB WebP; a transparent ingredient PNG keeps its transparency
- [ ] Unit tests: the fit maths, the upload/rollback order (mocked Storage)

### Definition of Done
No new object over ~300 KB reaches either bucket.

---

## Phase 39 — Retire Originals

### Goal
Delete the 131 original files once WebP has been stable.

### Tasks
- [ ] Wait period (≥ 7 days of normal use) without image issues
- [ ] Re-verify the backup (sha256) in both places
- [ ] `images:prune-originals` (dry run default, `--apply`): deletes only objects in `original_path` / `image_original_path` whose row points at a verified WebP, clears the column, writes a deletion log
- [ ] Document restore: re-upload from the backup + `images:flip -- --rollback`

### Verification
- [ ] Buckets ≈ 13 MB; every row still resolves; app checked

### Definition of Done
Only WebP remains in Storage.

**Manual:** explicit approval before `--apply`.

---

## Phase 40 — Data Layer & Performance

### Goal
Measure, then fix what the numbers show. Don't add machinery on a hunch.

### Tasks
- [ ] Lab Web Vitals for home, `/recepti`, a recipe, a category, on mobile (slow 4G, 4× CPU) and desktop. Option: port diecast's `scripts/perf/vitals.mjs` + `scripts/lib/headless.mjs` (local Edge/Chrome, no new dependency) → `docs/performance.md` with a budget
- [ ] Duplicate fetching: the same recipe list is fetched separately by home, `/recepti`, favourites and recently added, with no cache between pages. Add TanStack Query only if the measurements show it matters (justify the dependency); otherwise a small shared cache in `recipeQueries`
- [ ] Payload: list selects only card columns + the primary image (not every image), checked against `SEARCHABLE_RECIPE_SELECT`
- [ ] Bundle: check what's in `Combination` (68 kB gzip), `localizedField` (55 kB, i18next + both locale files?) and `CategorySelect` (`react-select`, 30 kB). Lazy-load the inactive locale; keep admin-only code (`react-select`, JSON editor, AI prompts) out of public routes
- [ ] `index.html`: `preconnect` to the Supabase URL
- [ ] Phase 32 (FTS) stays deferred. Record the trigger here: revisit when recipes > ~1,000 or the `/recepti` payload > ~500 kB gzip

### Verification
- [ ] Before/after numbers recorded; the budget is met or the gaps are listed

### Definition of Done
Public pages meet the recorded budget on mobile.

---

## Phase 41 — Deployment Hardening

### Goal
Match the game app's Vercel setup.

### Tasks
- [ ] `vercel.json`: `/assets/(.*)` → `Cache-Control: public, max-age=31536000, immutable`; security headers (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`); consider a CSP (Supabase URL in `connect-src`/`img-src`)
- [ ] `postbuild` secret scan: fail the build if a service-role/secret key string ends up in `dist/` (diecast `scripts/check-bundle-secrets.mjs`)
- [ ] `src/lib/supabaseClient.ts` rejects a secret/service-role key in `VITE_SUPABASE_ANON_KEY` (diecast `env.ts` pattern)
- [ ] 404 route for unknown paths under `:lang` (check what happens today)

### Verification
- [ ] Response headers checked on a preview deployment; a deliberate secret in a test build fails `postbuild`

### Definition of Done
Assets cached immutably, security headers on, secrets can't ship.

---

## Phase 42 — Quality Gates (CI & E2E)

### Goal
Stop regressions from reaching production automatically.

### Tasks
- [ ] `.github/workflows/ci.yml` (Node 22): `npm ci`, `lint`, `test`, `build` on pushes to `main` and on PRs (copy the game app's)
- [ ] `typecheck` script (`tsc -b`) covering `scripts/`
- [ ] Unit tests for code without them: `localizedPath`, `recipeSearchParams`, `slugify`, the favourites behaviour from Phase 33, `useRecipeImages` ordering helpers (extract them as pure functions first)
- [ ] Playwright E2E with the local Edge, **read-only by default** (a fixture fails any non-GET to Supabase): home → `/recepti` → search (incl. diacritics) → filters (category, subcategory, tags, favourites) → recipe detail → language switch (`/sr/...` ↔ `/en/...`) → category pages; at desktop and mobile. Admin flows go in a manual checklist unless a test project exists (Open decision 4)
- [ ] Owner: make CI a required check on `main`

### Verification
- [ ] CI blocks a deliberately broken commit; E2E green 3 runs in a row

### Definition of Done
Lint, tests and build gate every push; core public flows covered by E2E.

---

## Phase 43 — Docs, Backup & Production Verification

### Goal
Docs describe the real app; the release is verified.

### Tasks
- [ ] `CLAUDE.md`: add the ingredient catalog + nutrition (vitamins/minerals), meal plan, kitchen notes, subcategories, difficulties, favourites, JSON/AI import, the image variants + upload pipeline, the admin allow-list, the `images:*` / `verify:rls` scripts
- [ ] `README.md` (2 lines today): what the app is, setup, env, migrations (manual SQL editor), seed, scripts, testing, deployment
- [ ] `docs/backup.md` (from Phase 34): schedule + restore steps
- [ ] `DEVELOPMENT_PLAN.md`: keep Phase 32 there or move it into this file's backlog; one tracker only
- [ ] Release: preview deployment → owner check (sr/en, light/dark, desktop/mobile, admin CRUD signed in by hand) → `main`

### Verification
- [ ] Production: sign-ups off, images WebP, headers present, private tables not readable as anon

### Definition of Done
Docs match the app; production verified by the owner.

---

## Backlog (not scheduled)

- **Phase 32 — Postgres full-text search** (in `DEVELOPMENT_PLAN.md`): only when the trigger in Phase 40 fires.
- Recipe galleries with several photos per recipe (the schema already supports it; today every recipe has 1).
- Shared image-pipeline package for diecast/games/recipes, only if the three copies start to diverge.

## Open decisions / inputs needed

| # | Question | Needed by |
| --- | --- | --- |
| 1 | **The org is over its Storage quota (≈ 2.1 GB of 1 GB), mostly because of the game app.** If uploads are blocked, the WebP variants can't be uploaded until space is freed. Recipes are small (~13 MB of WebP), so doing **this app first is a cheap pilot** of the pipeline, but it frees only ~70 MB. The real fix is the game app's Phase 37. Options while blocked: a month of Pro ($25), or delete originals before upload (relying on the local backup) | Ph 34 / 36 |
| 2 | `kitchen_notes` and `meal_plan_entries`: private (admin-only), or meant to be public? | Ph 33 |
| 3 | Favourites for visitors: hide the heart for visitors (owner's favourites stay public as a filter), or let each visitor keep their own favourites in localStorage? | Ph 33 |
| 4 | E2E: a separate Supabase test project (allows admin-flow E2E; this org's two free slots are used, so it would go in another org) or read-only E2E against production? | Ph 42 |
| 5 | Recipe thumb size 600 px (sharp on 2× screens) vs 400 px (~24 KB measured, slightly soft) | Ph 35 |

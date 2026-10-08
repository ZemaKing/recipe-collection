# Recipe Collection — Images, Security & Hardening Roadmap

Follow-up to the build log in [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md). Its finished phases were cleared from that file (commit `c2232b1`); only the unscheduled **Phase 32 — Postgres Full-Text Search** remains there, and it stays deferred (see the end of this file). Numbering continues at **33**. Once this roadmap is approved it becomes the live tracker (update `CLAUDE.md` in Phase 33).

The image pipeline reuses the one built for the diecast app (`../diecast-collection/scripts/images/` + `src/lib/image-resize.ts`). That code was written app-agnostic so it could be reused here (diecast ROADMAP Phase 21). Its README even uses "recipe photos" as the example job.

**Status: Phase 33 code done 2026-10-08; waiting on the owner's dashboard steps. Phase 34 done 2026-10-08. Phase 35 done 2026-10-08. Phase 36 done 2026-10-08 (all images served as WebP). Phase 37 done 2026-10-08 (card thumbs re-done per Open decision 6). Phase 38 done 2026-10-08. Phase 39 done 2026-10-08 (owner shortened the wait): only WebP left, buckets 16.3 + 1.0 MB. ⚠ Org grace period ends 31 Oct 2026 (Storage 117 %): see Open decision 1.** Research done 2026-10-04 (findings below).

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

**Target after this roadmap:** 62 × (154 KB + ~45 KB) + 69 × 12 KB ≈ **13 MB** (from 84 MB, −85 %). With q85 (owner's choice) the Phase 35 dry run measured **15.3 MB** (−82 %).

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

- **WebP quality: 85 for every variant** (owner's choice, 2026-10-08; replaces the q82/q75/q80 first planned here). Applies to the migration scripts and the browser upload path (Phase 38).
- **Recipe variants:** `full` fits inside 1600×1600 (all current originals are ≤ 1536 px, so this is a re-encode, not a resize). The thumb (`card` variant) **covers 500×500**, i.e. its short edge is 500 (3:2 → 750×500), because cards crop it to a square of ≤ ~230 CSS px (Open decision 6, option b; it replaced the first 500×333 `.thumb.webp`).
- **Ingredient photo:** one WebP that fits inside 600×400, with alpha kept. Today's are 300×200, so they keep their size; uploads larger than that are downscaled. No thumb is needed.
- **Paths:** `{recipe_id}/{uuid}.webp` + `{uuid}.card.webp`; `{ingredient_id}/{uuid}.webp`. New photo = new UUID, so `Cache-Control: max-age=31536000` (Storage's `cacheControl` sets `max-age` only; no `immutable`). The migration keeps each original's UUID and swaps the extension (`…/{uuid}.png` → `…/{uuid}.webp`).
- **Rollback columns:** `original_path` (recipes) / `image_original_path` (ingredients) until Phase 39.

## Status

| # | Phase | Status | Needs from owner |
| --- | --- | --- | --- |
| 33 | Security & Privacy Lockdown | 🟡 DB locked down & verified; frontend not deployed | Deploy; admin CRUD check on the deployed site |
| 34 | Image Audit & Local Backup | ✅ Done 2026-10-08 | — |
| 35 | Image Pipeline Port & Schema | ✅ Done 2026-10-08 | — |
| 36 | WebP Migration of Existing Images | ✅ Done 2026-10-08 | Admin pages check when next signed in |
| 37 | Read Path: Thumbnails & Loading Priority | ✅ Done 2026-10-08 | Admin pages check when next signed in |
| 38 | Upload Path: WebP in the Browser | ✅ Done 2026-10-08 | — |
| 39 | Retire Originals | ✅ Done 2026-10-08 | Confirm the second backup copy is still intact |
| 40 | Data Layer & Performance | ⬜ Not started | — |
| 41 | Deployment Hardening | ⬜ Not started | — |
| 42 | Quality Gates (CI & E2E) | ⬜ Not started | Make CI a required check (GitHub setting) |
| 43 | Docs, Backup & Production Verification | ⬜ Not started | Go/no-go |

---

## Phase 33 — Security & Privacy Lockdown

### Goal
Only the owner can write; only intended data is public. Comes first because today any registered user can change everything.

### Tasks
- [x] **Owner, now:** Dashboard → Authentication → turn off "Allow new users to sign up"; check the Users list for unknown accounts
- [x] **Owner:** applied 2026-10-08 (run as `postgres`) `20261008120000_admin_lockdown.sql` in the SQL editor, after replacing `REPLACE_WITH_ADMIN_EMAIL` with the login email (editor only, not in git). It runs as one transaction and aborts if no user has that email. **Apply it before deploying this phase's frontend**, or the owner is shown "No admin access" (the `is_admin` RPC won't exist yet)
- [x] **Owner:** Dashboard → Authentication → Add user: a test account that is *not* an admin, for `RLS_USER_*`
- [x] Migration: `admin_users (user_id uuid primary key references auth.users)`, with RLS on and no API grants, plus `is_admin()` (`security definer`, `stable`, `search_path` pinned; executable by `authenticated` only)
- [x] Migration: every `*_authenticated_write` policy → `*_admin_write` with `using ((select is_admin())) with check ((select is_admin()))`, on all 16 tables
- [x] Storage, both buckets: one `*_bucket_admin_all` policy (incl. the `SELECT` that folder deletes and `remove()` need); public `SELECT` (listing) policies dropped. Buckets get `file_size_limit` 5 MB and `allowed_mime_types` JPEG/PNG/WebP (same as the client limits)
- [x] Open decision 2 → **both stay public.** `kitchen_notes` are shown on public recipe pages (Notes tab) and counted in the home stats, so making them private would have removed a public feature. Only their writes are locked down
- [x] Open decision 3 → **per-visitor localStorage.** The admin's hearts still write `recipes.is_favorite`; everyone else's go to localStorage (`src/lib/localFavorites.ts`, `useFavorites`), including the favourites page, the home "Favourites" chip/count and the `/recepti` favourites filter. A signed-in non-admin counts as a visitor
- [x] `ProtectedRoute` gates `/admin` on `isAdmin` (signed-in non-admins get a "No admin access" panel with sign-out)
- [x] `scripts/verify-rls.mjs` (`npm run verify:rls`): anon reads of all 16 tables, `admin_users` and bucket listing refused; with `RLS_ADMIN_*` set, creates one fixture per table + a PNG per bucket, attacks them as anon and as the non-admin (`RLS_USER_*`): insert/update/delete/upload/list/remove all refused; checks the fixtures survived, public URLs serve, buckets reject `text/plain`, the admin can update; then deletes everything (also on error)
- [x] Point `CLAUDE.md` at this roadmap

### Verification
- [x] `/auth/v1/settings` → `disable_signup: true` (checked 2026-10-08)
- [x] `verify:rls` green: **187 passed, 0 failed** (2026-10-08, anon + non-admin + admin)
- [ ] The owner can still create/edit/delete a recipe, an ingredient, a photo, a note and a meal-plan entry (on the deployed site)
- [x] As a visitor, the favourite button does what decision 3 says (no silent revert): checked on the dev server, sr + en, desktop; recheck on the deployed site

### Definition of Done
Writes require `is_admin()`, sign-ups are off, private data isn't public, and a script proves it.

---

## Phase 34 — Image Audit & Local Backup

### Goal
One checksummed copy of every original (84 MB) before anything changes. That copy is also the conversion source.

### Tasks
- [x] Owner: Dashboard → Organization → Usage, 2026-10-08 (cycle 10 Sep – 10 Oct 2026): **Storage 1.173 / 1 GB (117 %)**, egress 3.697 / 5 GB (74 %), cached egress 3.706 / 5 GB (74 %), DB 0.034 / 0.5 GB. Not restricted yet: the org exceeded Storage in the previous cycle and is in a **grace period until 31 Oct 2026**; after that, if still over quota, every project in the org (this one included) answers 402 (→ Open decision 1)
- [ ] Owner (optional now): `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. The scripts fall back to the admin login (`RLS_ADMIN_*`), which can list both buckets and read every table; only the `admin_users` export needs the key
- [x] `scripts/images-audit.ts` (`npm run images:audit`): rows vs objects for both buckets, bytes by format, orphans, shared paths, duplicate content (ETag + size), one HEAD per public URL → `docs/images-audit.md`. Run 2026-10-08: 62 + 69 objects, 83.60 MB, 0 missing / orphans / duplicates / HEAD problems. Stored `Cache-Control` is `max-age=3600` on all 131 (a HEAD answers `no-cache`, so the audit reports the stored value)
- [x] `scripts/images-backup.ts` (`npm run images:backup`, dry run by default; `-- --apply` downloads; `-- --verify` re-hashes offline): both buckets → git-ignored `backups/images/{bucket}/…` + `manifest.json` (bytes, sha256, ETag, sniffed type, width × height); resumable, size- and MD5-checked, never deletes. Dimensions come from `scripts/lib/image-info.ts` (PNG/JPEG/WebP header parser, no dependency). Node 24 runs the `.ts` scripts directly (type stripping), so no `tsx` yet
- [x] Owner approved; `npm run images:backup -- --apply` run 2026-10-08: 131 files, 83.60 MB, all size/MD5-checked. Manifest dims: ingredients 69 × 300×200 PNG; recipes 29 PNG 900×600 (one 900×601), 13 PNG 1536×1024, 19 JPEG 1200×800, 1 JPEG 1536×1024. Bucket listing retries on Storage's transient "Too many connections"
- [x] DB export: `npm run db:export` → `backups/db/{timestamp}/{table}.json` + `manifest.json` (row counts, sha256), through the API because `pg_dump` needs the DB password. First export 2026-10-08: 16 tables, `admin_users` skipped (needs the service-role key). Procedure + restore in `docs/backup.md`
- [x] Owner copied `backups/` to a second place (2026-10-08)

### Verification
- [x] Audit matches the findings: 62 + 69 objects, ≈ 84 MB (83.60 MB), 0 orphans
- [x] A re-run of the backup downloads 0 bytes; `--verify` passes (131/131, 2026-10-08)

### Definition of Done
Verified local copy of every image + DB export, in two places. ✅

---

## Phase 35 — Image Pipeline Port & Schema

### Goal
Bring in the diecast converter and add variant columns. No row changes yet.

### Tasks
- [x] Copy `scripts/images/` from diecast with its tests (reformatted with this repo's Prettier). Dev dependency: **`sharp`** (WebP encoding, scripts only). **No `tsx`**: Node 24 runs the `.ts` scripts directly, like the Phase 34 scripts
- [x] Local source support: `ImageSource.file` + `sha256` read originals from `backups/images/` (Phase 34) instead of URLs, so the migration needs no download egress. Also per-variant `pathPattern` and several jobs per CLI run. The differences are listed in `scripts/images/README.md` so the game app's copy can take the same change (it hasn't started its Phase 33 yet; diecast's copy is unchanged)
- [x] Migration `20261008130000_image_variants.sql`: `recipe_images` add `thumb_path`, `width`, `height`, `original_path`; `ingredients` add `image_width`, `image_height`, `image_original_path` (all nullable, dims both-or-neither and > 0). `src/types/recipe.ts` / `ingredient.ts` (`original_path` columns stay script-only), one `RECIPE_IMAGE_COLUMNS` fragment for the summary/searchable, admin-list and detail selects, `pickPrimaryImage`/`mapRecipeSummaryRow` (+ tests), `useIngredients` select
- [x] Two jobs in `scripts/migrate-images/`: `recipe-job.ts` (full ≤ 1600 + thumb ≤ 600) and `ingredient-job.ts` (one ≤ 600×400 variant), all q85, `cacheControl` one year; `sources.ts` maps rows (`original_path ?? storage_path`) to sources, keyed by the original's path (+ tests)
- [x] `tsconfig.scripts.json` so `tsc -b` covers `scripts/`; npm scripts `images:migrate`, `images:check` (both run both jobs)
- [x] **Owner:** applied `20261008130000_image_variants.sql` in the SQL editor (2026-10-08). The app's recipe queries select the new columns, so this frontend needs it

### Verification
- [x] Dry run over all 131 images (2026-10-08): **0 failures, 131/131 from local files, 0 B downloaded. 83.6 MB → 15.3 MB (−82 %)**: recipe full 62 × avg 171 KB = 10.4 MB, thumb 62 × avg 66 KB = 4.0 MB, ingredients 69 × avg 13.5 KB = 0.93 MB. (q85 instead of q82/75/80, hence ≈ 15 MB rather than the ≈ 13 MB estimated)
- [x] `npm run lint` ✅, `npm test` ✅ 166 tests / 22 files, `npm run build` ✅ (`tsc -b` now includes `scripts/`)
- [x] App unchanged with the new nullable columns (2026-10-08): dev server, home, `/sr/recepti` + `/en/recepti`, a recipe detail and a category page render with their photos and no console errors; the admin recipe-list, ingredients and image-manager selects run with the admin login (the admin UI itself wasn't signed into). New columns all null, no row changed

### Definition of Done
Pipeline and schema ready; no user-visible change.

---

## Phase 36 — WebP Migration of Existing Images

### Goal
Upload WebP for every recipe and ingredient photo, verify, and switch rows in one transaction with a tested rollback.

### Tasks
- [x] Thumb → 500 px (Open decision 5). Dry run: 131 sources, 0 failures, **83.6 MB → 14.3 MB** (full 10.4 MB, thumb 62 × avg 49.5 KB = 3.0 MB, ingredients 0.93 MB)
- [x] `images:migrate -- --limit=5 --apply` (5 + 5), `images:check -- --full` 15/15, served `image/webp` + `Cache-Control: public, max-age=31536000`; then the rest (2026-10-08): 0 failures, 0 B downloaded (Storage's transient "Too many connections" retried automatically). The org quota didn't block uploads
- [x] `images:check -- --full`: **124/124 recipe + 69/69 ingredient objects** match the manifests (sha256 + dimensions)
- [x] DB functions `set_recipe_image_variants(jsonb)` / `set_ingredient_image_variants(jsonb)` (`20261008140000_image_variant_flip.sql`): one transaction per table, refuse (and change nothing) if any row's current path isn't the expected `from_path`; the same function does the rollback. `security invoker` + admin check instead of "service role only", because there's no service-role key in `.env.local` (RLS still applies; service role also allowed)
- [x] `images:flip` (dry run default, `--apply`, `--rollback`, `--job=`): plan from the manifests (`flip-plan.ts`, tested), then a HEAD of every URL the rows point at. Dry run: 62 + 69 rows to change, 0 problems
- [x] **Owner:** applied `20261008140000_image_variant_flip.sql` (2026-10-08)
- [x] `images:flip -- --apply` (62 + 69 rows, one transaction each); rollback exercised once (`--rollback --apply` → 62/62 + 69/69 URLs served the original types, then `--apply` again). A call with one wrong `from_path` was refused with nothing changed; anon gets `permission denied`
- [x] Commit the manifests (`scripts/migrate-images/recipe-manifest.json`, `ingredient-manifest.json`)

### Verification
- [x] 62/62 recipe rows (124/124 URLs incl. thumbs) and 69/69 ingredient rows serve `image/webp`; the rollback was exercised once
- [x] Browser (dev server, 2026-10-08): home, `/recepti` (scrolled through), a category and a recipe detail in sr + en: every Storage image is `.webp`, none broken. Admin pages need a sign-in: their selects were run with the admin login instead (62 rows on WebP, 69 ingredients with dims). Ingredient transparency: all 69 WebPs have an alpha channel with transparent pixels (checked per pixel; the light/dark screenshot didn't render in the pane). **Owner:** glance at admin recipes + ingredients (light/dark) next time you sign in

### Definition of Done
All images served as WebP; originals untouched in Storage and backed up.

---

## Phase 37 — Read Path: Thumbnails & Loading Priority

### Goal
Cards load thumbnails; the detail hero loads the full image first.

### Tasks
- [x] `storage.ts`: `getRecipeImageUrls(image) → { full, thumb }` (`thumb_path ?? storage_path`), unit-tested
- [x] `RecipeImage` gets `variant` (default `thumb`) + `fetchPriority`: **thumb** for `RecipeCard` (every grid), `AdminRecipesPage` table + cards, `ImageManager` tiles (`useRecipeImages` now selects `thumb_path`); **full** for `ImageGallery` / `RecipeDetailHero`
- [x] `width`/`height` on `<img>` when known (the full image's; the thumb has the same aspect ratio); the detail hero keeps `loading="eager"` + gets `fetchpriority="high"`; the first row of cards loads eager (home: 4, `/recepti`: 5, the widest layouts), the rest lazy
- [x] `IngredientImage` uses the stored dimensions (`image_width`/`image_height`)
- [x] Found on the way: replacing a photo in the admin only rewrote `storage_path`, so cards would have kept the old thumb. Replace now clears `thumb_path`/`width`/`height` (and `image_width`/`image_height` for ingredients) and best-effort deletes the old thumb; removing a photo deletes its thumb too. `original_path` is left alone (Phase 38/39). Proper variant writes on upload are Phase 38

### Verification
- [x] `/recepti` with all 62 recipes references **only thumbnails: 62 × `.thumb.webp` = 3.00 MB in total** (was ≈ 79 MB of originals); first 5 eager, the rest lazy; no `full` URL on home, `/recepti` (sr + en), a category or recently added. The recipe detail requests only its full `.webp`, eager + `fetchpriority=high`, with `width`/`height`. (Byte totals from the manifest: the browser pane was hidden, so lazy images didn't load during the check, and Storage sends no `Timing-Allow-Origin`, so resource timing reports 0 bytes)
- [x] No layout shift while cards load: every image sits in a fixed `aspect-square` / `aspect-video` box
- [x] No visible blur on a 2× screen: the first thumbs (fit inside 500×500 → 500×333, cropped to 333×333) were up to ~1.4× upscaled on cards (≈ 148 CSS px on a phone, 150 at 1024 px, 220 at 767 px). **Fixed with Open decision 6 (b):** new `card` variant covering 500×500 (750×500, crop 500×500 ≥ 2.2× of the largest card), q85, avg 93 KB = **5.6 MB for all 62** on `/recepti`. Uploaded at new paths `{uuid}.card.webp` (full images not re-uploaded: the pipeline now skips variants already done), `images:check --full` 186/186 + 69/69, `thumb_path` switched with `images:flip --job=recipes --apply` (62 rows, one transaction; the existing function, from_path = to_path). Browser: all 62 cards load `.card.webp` (749–750×500); hero still the full `.webp`
- [ ] Admin recipes/ingredients pages checked signed in (owner)

### Definition of Done
No list view downloads a full-size recipe photo. ✅

---

## Phase 38 — Upload Path: WebP in the Browser

### Goal
New uploads are stored as small WebP files, PNGs included.

### Tasks
- [x] Copy diecast `src/lib/image-resize.ts` + its tests (no imports; EXIF-aware decode, step-down resize, `OffscreenCanvas` + fallback, WebP with a PNG fallback), plus `fit: 'outside'` like the scripts
- [x] Replace `resizeImageIfNeeded()`. **The PNG skip is gone.** Every input → WebP q85: recipes `full` (≤ 1600) + `card` (covers 500×500, `{uuid}.card.webp`, same as the migration), ingredients one variant (≤ 600×400, alpha kept); `cacheControl` one year, `contentType` set, `upsert: false`. Variants are exported (`RECIPE_IMAGE_VARIANTS`, `INGREDIENT_IMAGE_VARIANT`) and match `scripts/migrate-images/`
- [x] Upload order: files one by one; if any fails, the ones already uploaded are removed and the error rethrown. `useRecipeImages.addImage` / `replaceImage` write `storage_path`, `thumb_path`, `width`, `height` (and clear `original_path`); a failed row write removes the new files; replace/remove delete **every** file of the old photo (full, thumb and a migrated photo's pre-WebP original, which is in the Phase 34 backup). `removeImage` deletes the row first, then the files (best effort). `useIngredientImage.setImageFile` / `removeImage` the same with `image_width`/`image_height`/`image_original_path`
- [x] Input size limit 5 → 25 MB (only the output is stored), hint/error copy in `sr` + `en`. Migration `20261008150000_image_buckets_webp.sql`: both buckets' `allowed_mime_types` → WebP + PNG (fallback); `file_size_limit` stays 5 MB (a PNG fallback can reach a few MB)
- [x] The JSON/AI recipe import attaches no images (nothing to change)
- [x] **Owner:** applied `20261008150000_image_buckets_webp.sql` (2026-10-08). Checked as the admin: both buckets reject `image/jpeg` and accept `image/webp` + `image/png` (test files removed)

### Verification
- [x] Unit tests: the fit maths (incl. `outside`), the upload/rollback order and the cleanup (mocked Storage + resizer, `storage.upload.test.ts`)
- [x] Real Chromium (dev server, no upload): a real 2.97 MB PNG original (1536×1024) → full 1536×1024 **403 KB** + card 750×500 **118 KB** WebP in 176 ms (sharp gave 390 + 135 KB); a transparent 300×200 PNG → 300×200 WebP with alpha 0 in the corner
- [x] Owner uploaded a dish photo and an ingredient photo by hand (2026-10-08) and checked replace/remove ("all works"). Checked by script: dish → full 1200×800 **187 KB** + card 750×500 **83 KB**, ingredient → 600×400 **60 KB**, all `image/webp`, `max-age=31536000`, rows carry the paths + dimensions; the two folders hold exactly the referenced files (nothing left behind)
- [x] "No new object over ~300 KB": met by the hand uploads (≤ 187 KB). Note: **the largest full image is ≈ 400 KB** (1536 px at q85, same as the migrated ones; cards ≤ ~135 KB). Within the bucket limit; lowering it would need a lower quality or max width

### Definition of Done
No new object over ~300 KB reaches either bucket (see the note above: ≈ 400 KB for the biggest full images at q85).

---

## Phase 39 — Retire Originals

### Goal
Delete the 131 original files once WebP has been stable.

### Tasks
- [x] Wait period: **shortened by the owner** (approved 2026-10-08, the day WebP went live; Open decision 1 allowed it). The originals are backed up locally (sha256-verified) and in a second place
- [x] Re-verify the backup (sha256): local `images:backup -- --verify` **131/131, 83.60 MB** (2026-10-08). [ ] Owner: confirm the second copy (approved the deletion without re-checking it)
- [x] `images:prune-originals` (dry run default, `--apply`, `--restore`, `--job=`; `prune-plan.ts` tested): deletes only originals whose row points at its migrated WebP, that are in the local backup with a matching sha256 and that no row uses; plus the 62 superseded `{uuid}.thumb.webp` (unused since Phase 37, also dropped from the upload manifest). Every row's WebP + thumb must serve `image/webp` at the manifest size first; any problem blocks `--apply`. Deletes in batches (Storage reports what it removed), then clears `original_path` / `image_original_path` in one transaction per table, and appends to `scripts/migrate-images/prune-log.json`
- [x] Dry run (2026-10-08): **62 + 69 originals = 83.60 MB, 62 superseded thumbs = 3.00 MB, 0 problems**, 124 + 69 WebP URLs checked
- [x] Document restore (`docs/backup.md` → "Pre-WebP originals"): allow JPEG on the buckets for the moment, `images:prune-originals -- --restore --apply` re-uploads from the backup and sets `original_path` again, then `images:flip -- --rollback --apply` works as before
- [x] **Owner approved** (2026-10-08); `images:prune-originals -- --apply`: **193 files deleted** (62 + 69 originals, 62 superseded thumbs), 0 failed; `original_path` cleared on 62 + 69 rows (one transaction each); `prune-log.json` written; superseded thumbs dropped from `recipe-manifest.json`. A second dry run finds nothing left

### Verification
- [x] Buckets: `recipe-images` **126 objects, 16.27 MB**, `ingredient-images` **70 objects, 0.97 MB**, all `image/webp` (14.3 MB migrated + the hand uploads). `images:audit`: 0 missing, 0 orphans, 0 duplicates, 0 HEAD problems (the audit now counts `thumb_path`/`original_path` as references and retries 429s). `images:check --full` 124/124 + 69/69. Browser: home, `/recepti`, a category and a recipe detail: every image `.webp`, all 200

### Definition of Done
Only WebP remains in Storage. ✅

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
| 1 | **The org is over its Storage quota: 1.173 GB of 1 GB on 2026-10-08 (was ≈ 2.1 GB on 2026-10-04), mostly the game app.** Uploads still work, but the grace period ends **31 Oct 2026**; if the org is still over 1 GB then, all its projects (this site too) get 402s. It needs ≥ 173 MB freed, plus headroom. **This app's part is done (Phase 39, 2026-10-08): its buckets went from 83.6 MB to 17.2 MB, ≈ 66 MB freed.** Check the org's Usage page for the new total, so **the game app must free ≥ ~110 MB by 31 Oct** whatever happens here. Plan: Phases 35–36 by ~15 Oct, Phase 39 (needs the 7-day wait + approval) by ~25 Oct; game app's image phase in parallel. Fallbacks: a month of Pro ($25), or shorten Phase 39's wait (the originals are backed up in two places) | Ph 36 / 39, **by 31 Oct** |
| 2 | ~~`kitchen_notes` and `meal_plan_entries`: private or public?~~ **Decided 2026-10-08: both stay publicly readable**; only writes are admin-only | Ph 33 ✅ |
| 3 | ~~Favourites for visitors: hide or localStorage?~~ **Decided 2026-10-08: per-visitor localStorage**; the admin's hearts keep writing `is_favorite`. (The finding above was partly stale: visitors already saw a read-only heart; the silent revert hit only signed-in non-admins) | Ph 33 ✅ |
| 4 | E2E: a separate Supabase test project (allows admin-flow E2E; this org's two free slots are used, so it would go in another org) or read-only E2E against production? | Ph 42 |
| 5 | ~~Recipe thumb size 600 vs 400 px~~ **Decided 2026-10-08: 500 px** (q85: avg 49.5 KB, 3.0 MB for all 62) | Ph 36 ✅ |
| 6 | ~~**Card thumbs are slightly soft on 2×/3× screens**~~ **Decided 2026-10-08: (b), done in Phase 37** (750×500 `card` variant, 5.6 MB for all 62). Was: thumbs fit inside 500×500, so landscape photos are 500×333 and the square card crops 333×333. Options: (a) keep as is (3.0 MB for all 62); (b) bound the *short* side instead (`fit: outside`, e.g. 750×500 → 500×500 crop, roughly +60–80 % thumb bytes, est. ~5 MB); (c) square-cropped 480×480 thumbs (sharp, ≈ today's bytes, but the admin table's 3:2 tiles lose the sides). Re-upload of 62 thumbs at new paths + a flip of `thumb_path` | Ph 37 ✅ |

# Recipe Collection — Development Plan

See the master plan rationale (mockup analysis, schema design, i18n architecture, security model) for full context behind these phases. This file is the live progress tracker — update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: Phase 1 — built, pending Supabase migration apply + manual verification. Phases 2–8 are unscheduled backlog ideas.
MVP Status: Complete

---

## Phase 1 — Ingredient Master-Catalog & Auto-Calculated Nutrition (built, pending migration apply + manual verification)

### Goal

A proper ingredient catalog (bilingual names, Latin name, category, a short educational fact, per-100g nutrition, image) that backs an autocomplete in the recipe ingredient editor, and drives automatic per-recipe/per-serving nutrition display on the recipe detail page — without requiring every existing free-text ingredient to be migrated up front. Supersedes the earlier "manual nutrition entry" idea: nutrition is calculated from linked ingredients rather than typed in per recipe. Also restructures the recipe detail page per a mockup (`recepies-details/Nutrition.png`) into real tabs (Ingredients · Instructions · Nutrition · Tips) instead of a stacked layout — an initial anchor-scroll-nav version (all sections always visible, just scrolled to) didn't read as real tabs and was replaced with actual Radix `Tabs`, using `forceMount` on each panel + CSS `data-[state=inactive]:hidden` so switching tabs hides content instead of unmounting it (`IngredientList` holds live servings/checkbox state that must survive tab switches).

**⚠ Not yet applied to Supabase.** The migration (`supabase/migrations/20260912120000_ingredient_catalog.sql`) and seed additions (`supabase/seed.sql`) are written and code-complete, but this environment has no Supabase CLI/credentials to run them against the live project. Run them (SQL editor or `supabase db push`) before any of this is usable in the deployed app.

### Tasks

- [x] Migration: new `ingredient_categories` table (slug/name_en/name_sr), seeded with the 10 categories from the reference library (dairy, vegetables, misc/additives, fish-and-meat, sweets, oils-and-fats, vitamins-and-minerals, fruit, herbs-and-spices, grains)
- [x] Migration: new `ingredients` table — name_en/name_sr, `latin_name`, `regional_names`, `fact_en`/`fact_sr`, `default_unit_en`/`default_unit_sr`, per-100g nutrition (`calories_kcal`, `protein_g`, `fat_g`, `carbs_g`, `fiber_g`), `micronutrients` jsonb, `unit_conversions` jsonb, image columns (`image_storage_path`, `image_alt_en`, `image_alt_sr`)
- [x] Migration: nullable `recipe_ingredients.ingredient_id` FK (`on delete set null`)
- [x] `IngredientEditor`: autocomplete the name_en input against the catalog (with a live default-unit + short-fact preview and an "add to catalog" link when there's no match, per the mockup); selecting a suggestion sets `ingredient_id` and prefills name_sr/default unit
- [x] Extend `recipeFormSchema.ts`'s `ingredientSchema` with an optional `ingredient_id`
- [x] New `AdminIngredientsPage` (`/admin/sastojci`) — search/category-filter table, mirroring `AdminRecipesPage`'s pattern
- [x] Ingredient create/edit form (`AdminIngredientFormPage`/`IngredientForm`) — all catalog fields, micronutrients and unit_conversions as repeatable rows
- [x] New `src/lib/nutrition.ts` — pure functions computing recipe-total and per-serving nutrition from catalog-linked ingredients, grams-based via `unit_conversions`, skipping unresolvable ingredients rather than guessing
- [x] New `NutritionPanel` component (macro cards, vitamins/minerals with %DV via new `src/lib/nutritionReference.ts`, per-serving/total-recipe toggle) — hidden entirely if zero ingredients are catalog-linked
- [x] `RecipeDetailPage` restructured into real tabs on tablet/mobile only (`Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` from `src/components/ui/tabs.tsx`, previously built but unused, restyled to an underline tab look) — Ingredients/Instructions/Nutrition/Tips, Tips omitted when empty, sticky `TabsList`, each `TabsContent` uses `forceMount` so switching tabs never unmounts/resets `IngredientList`'s state. Desktop (`min-width: 1024px`, via new `useMediaQuery` hook) keeps the original always-visible stacked layout instead — plenty of room there, no need to hide anything behind a tab
- [ ] Ingredient image upload (reusing `ImageManager.tsx`/`storage.ts` patterns) — **deferred**, not built in this pass; `image_storage_path`/`image_alt_en`/`image_alt_sr` columns exist but nothing writes to them yet

### Database / Supabase

- [x] `ingredient_categories` + `ingredients` tables written, RLS mirroring the `categories`/`tags` pattern — **not yet applied to the live project**
- [x] `recipe_ingredients.ingredient_id` nullable FK written — **not yet applied**
- [x] Seed data: 10 ingredient categories + 6 starter ingredients, with Šopska salata's ingredients linked for an end-to-end nutrition demo once seeded

### UI / UX

- [ ] Autocomplete suggestions list keyboard-navigable and dismissible — implemented, not manually browser-verified
- [ ] Nutrition panel's per-serving/total-recipe toggle and vitamins/minerals collapse on tablet/mobile — implemented per the mockup, not manually browser-verified
- [ ] Tab bar scrolls horizontally and switching tabs behaves correctly at desktop/tablet/mobile widths — not manually browser-verified (no browser tool in this environment)

### Internationalization

- [x] Catalog entries carry name_en/name_sr, fact_en/fact_sr, default_unit_en/sr; `latin_name`/`regional_names` are single non-bilingual columns
- [x] All new admin/nutrition-panel strings added to both `en.json`/`sr.json`

### Testing & Verification

- [x] Unit tests for the nutrition calculation util (`src/lib/nutrition.test.ts` — grams conversion, unit_conversions lookup, skip-unresolvable, micronutrient summing, per-serving/total scaling)
- [x] `npm run lint && npm run build && npm test` all pass (68 tests)
- [ ] Manual: apply the migration/seed, then verify autocomplete, the nutrition panel, and the admin catalog CRUD end to end in a real browser

### Definition of Done

- [ ] Admin ingredient name inputs autocomplete from a shared catalog; recipes with catalog-linked ingredients show correct per-recipe/per-serving nutrition on the public detail page — **code complete; blocked on applying the migration and a manual verification pass**

### Out of Scope

Full-prose encyclopedia content or public ingredient detail pages (only the short `fact_en`/`fact_sr` blurb is shown); automatic unit conversion for units without an explicit `unit_conversions` entry; backfilling every existing recipe's free-text ingredients to catalog links (linking happens organically as recipes are edited); ingredient image upload (deferred, see Tasks); the bulk import of the user's ~200-item reference library and ongoing manual catalog entry beyond the 6 seeded starter ingredients.

### Phase Status

- [ ] Phase Complete

---

## Phase 2 — Postgres Full-Text Search (not scheduled)

### Goal

Move recipe search from client-side filtering to server-side Postgres full-text search once the collection is large enough that shipping the full recipe list to the browser stops being practical.

### Tasks

- [ ] Migration: generated `tsvector` column on `recipes` (name_en/name_sr, `'simple'` text search config — no Serbian dictionary exists in Postgres) + GIN index
- [ ] Decide how ingredient-name matches are handled (trigger-maintained combined vector, or a join-based search query) — current client-side search also matches ingredient names
- [ ] Replace `useAllRecipes` (fetches the entire table, unpaginated) with a paginated, server-searched hook using supabase-js `.textSearch()` + `.range()`, mirroring the pagination `useAdminRecipes` already does
- [ ] Rework `AllRecipesPage` so category/tag/favorite filters and the search query are server-side conditions instead of filtering an in-memory list, with the same debounce-then-refetch pattern the admin recipe list already uses

### Database / Supabase

- [ ] New migration adding the generated tsvector column + GIN index; no RLS changes needed (derived from already-public columns)

### UI / UX

- [ ] No regression in filter/sort/tag behavior on `AllRecipesPage` after the move to server-side querying

### Internationalization

- [ ] Search behaves reasonably for both EN and SR recipe names given the `'simple'` (non-stemming) text search config

### Testing & Verification

- [ ] Manual: search/filter/sort still work correctly against a larger seeded dataset; confirm network payload no longer includes the full recipe table on every page load

### Definition of Done

- [ ] `/recepti` search is server-side and paginated; the browser no longer downloads the entire recipe catalog to filter it locally

### Out of Scope

Stemming/relevance ranking beyond Postgres's `'simple'` config, typo-tolerant/fuzzy search.

### Phase Status

- [ ] Phase Complete

---

## Phase 3 — Automated Storage Orphan-Sweep Job (not scheduled)

### Goal

Automatically clean up Supabase Storage objects left behind by failed/interrupted image replace or delete operations.

### Tasks

- [ ] Scheduled job (Supabase Edge Function on a cron, or Vercel cron hitting a serverless endpoint) that lists storage objects and compares against `recipe_images.storage_path` rows
- [ ] Delete storage objects with no matching `recipe_images` row
- [ ] Add a dry-run/logging mode to verify correctness before enabling actual deletion

### Database / Supabase

- [ ] Job needs service-role access to Storage (server-side only — never exposed to the frontend, consistent with the existing "never introduce service-role keys into frontend code" rule)

### UI / UX

- [ ] N/A for this phase

### Internationalization

- [ ] N/A for this phase

### Testing & Verification

- [ ] Manual: intentionally leave an orphaned object (e.g. cancel an upload mid-replace) and confirm the sweep removes it without touching in-use images

### Definition of Done

- [ ] Orphaned Storage objects are removed automatically on a schedule without risk to images still referenced by a recipe

### Out of Scope

General Storage quota/cost monitoring.

### Phase Status

- [ ] Phase Complete

---

## Phase 4 — Favorites Page (not scheduled)

### Goal

Give the `/omiljeni` nav destination (sidebar + bottom tab bar, linked since Phase 2/Phase 7) an actual page instead of the "hasn't been implemented yet" placeholder. Phase 17 wired up the favorite toggle itself (`is_favorite`, heart icon, `?favorite=1` filter on `/recepti`) but never built a dedicated listing page.

### Tasks

- [ ] Add a `useFavoriteRecipes` hook (favorites-only query), matching the existing one-hook-per-query-shape pattern
- [ ] Build the `/omiljeni` page reusing the established `RecipeCard` grid + `EmptyState` pattern from `AllRecipesPage`/`CategoryRecipesPage`
- [ ] Replace the `PlaceholderPage` route for `omiljeni` in `App.tsx` with the real page

### Database / Supabase

- [ ] N/A — reuses the existing `is_favorite` column and RLS policies

### UI / UX

- [ ] Empty state when the admin has no favorites yet
- [ ] Grid matches the existing browse pages' responsive breakpoints

### Internationalization

- [ ] Page title/empty-state copy localized (EN/SR) — likely already present from the nav label and placeholder strings

### Testing & Verification

- [ ] Manual: favoriting/unfavoriting a recipe is reflected on `/omiljeni`

### Definition of Done

- [ ] `/omiljeni` shows the admin's favorited recipes in the standard grid, with a proper empty state, instead of the placeholder

### Out of Scope

Per-visitor (non-admin) favorites.

### Phase Status

- [ ] Phase Complete

---

## Phase 5 — Recently Added Page (not scheduled)

### Goal

Give the `/nedavno-dodati` nav destination (sidebar + Home's quick filter) an actual page instead of the placeholder. `AllRecipesPage` already supports a `sort=recent` mode (`created_at` descending) and Home's recent-recipes strip already queries the newest 8 — this is the same shape, unfiltered, in the full grid.

### Tasks

- [ ] Build the `/nedavno-dodati` page: `useAllRecipes` (or a thin variant) sorted newest-first, no filters, reusing the `RecipeCard` grid + `EmptyState` pattern
- [ ] Replace the `PlaceholderPage` route for `nedavno-dodati` in `App.tsx` with the real page

### Database / Supabase

- [ ] N/A — reuses the existing `created_at` column, no schema changes

### UI / UX

- [ ] Empty state when the collection has zero recipes
- [ ] Grid matches the existing browse pages' responsive breakpoints

### Internationalization

- [ ] Page title copy localized (EN/SR) — already present from the nav label and placeholder strings

### Testing & Verification

- [ ] Manual: adding a new recipe moves it to the top of `/nedavno-dodati`

### Definition of Done

- [ ] `/nedavno-dodati` shows all recipes newest-first in the standard grid, with a proper empty state, instead of the placeholder

### Out of Scope

Configurable time-window filtering (e.g. "added this week").

### Phase Status

- [ ] Phase Complete

---

## Phase 6 — Admin Category & Tag Management (not scheduled)

### Goal

Let the admin create/edit/delete recipe categories and tags from the UI instead of hand-written SQL migrations, and eliminate the current hardcoded duplication — a new category today requires editing `supabase/seed.sql`, `src/lib/categoryIcons.ts`, `src/components/layout/nav-items.ts`, and both locale files. Closes the missing "Predjela" (Appetizers) category gap as a concrete first deliverable.

### Tasks

- [ ] Build `AdminCategoriesPage` + `AdminTagsPage` (or one combined admin screen), reusing the closest existing CRUD-dialog pattern in the codebase: `NoteFormDialog.tsx` + `DeleteNoteDialog.tsx` (create/edit dialog + confirm-delete dialog pair)
- [ ] Category delete must handle the existing `recipes.category_id ... on delete restrict` FK — surface a clear "reassign recipes first" error rather than a raw Postgres error
- [ ] Replace the hardcoded `categoryNavItems` (`nav-items.ts`) and `categoryIconBySlug` (`categoryIcons.ts`) with sidebar/bottom-tab rendering driven live from `useCategories()`, falling back to the existing `MoreHorizontal` icon for categories without a hand-picked one (or add an optional `icon_name` column the admin picks from a fixed palette — decide at implementation time)
- [ ] Once categories render dynamically from `name_en`/`name_sr`, remove the now-unnecessary static `category.*` locale-file entries
- [ ] Add "Appetizers" / "Predjela" as an actual seeded category (`predjela`) — deliverable independently and immediately, even before the full CRUD UI ships

### Database / Supabase

- [ ] No schema migration needed for the CRUD itself — `categories`/`tags` RLS already allows authenticated write

### UI / UX

- [ ] Clear, non-technical error message when attempting to delete a category still assigned to recipes

### Internationalization

- [ ] Category/tag names entered via the admin form are bilingual (name_en/name_sr), consistent with existing fields

### Testing & Verification

- [ ] Manual: create, edit, and delete a category and a tag; confirm the public sidebar/nav reflects changes without a code deploy
- [ ] Manual: attempt to delete a category with recipes assigned, confirm the clear error message

### Definition of Done

- [ ] Admin can fully manage categories and tags (including adding "Predjela") from the UI; adding a category no longer requires editing code

### Out of Scope

Reordering categories/tags (rely on alphabetical or creation order); bulk category merge/rename-with-recipe-reassignment tooling.

### Phase Status

- [ ] Phase Complete

---

## Phase 7 — "From Mom" Quick Filter (not scheduled)

### Goal

A special quick-filter tag for recipes passed down from the user's mother ("Mamin recept" / "From Mom"), styled in pink/red instead of the shared green used for the other quick filters (Za početnike, Bez glutena, Brzi recepti, Sezonski recepti, Vegetarijanski) added in the earlier quick-filters redesign.

### Tasks

- [ ] Add a `mamin-recept` tag row (name_en "From Mom", name_sr "Mamin recept") — via `supabase/seed.sql` if done before Phase 6 ships, or through the Phase 6 admin tag UI once it exists
- [ ] Add an icon for it in `src/lib/tagIcons.ts` (e.g. `Heart`, distinct from the other tags' icons)
- [ ] Give this one tag pink/red styling instead of the generic green `--color-tag` tokens — reuse the existing `--color-favorite` token (already pink/red, used for the favorite heart) rather than introducing a new color token
- [ ] Update the tag-rendering logic in `Sidebar`'s `QuickFilters` and `AllRecipesPage`'s tag chips (both the mobile full-list and desktop active-list) to special-case this tag's color instead of applying the uniform `text-tag`/`bg-tag-soft`/`border-tag` classes used for every other tag

### Database / Supabase

- [ ] New `tags` row (no schema change — `tags` table already supports arbitrary rows)

### UI / UX

- [ ] Icon and label consistently pink/red everywhere this tag appears (sidebar icon-only tablet state, sidebar full label, mobile/desktop filter chips), matching the always-colored-icon pattern established for the other quick filters

### Internationalization

- [ ] name_en/name_sr on the tag row cover both languages, consistent with how other tags work (no locale-file changes needed)

### Testing & Verification

- [ ] Manual: filtering by "Mamin recept" works identically to other tags functionally, differing only in color

### Definition of Done

- [ ] "Mamin recept"/"From Mom" appears as a quick filter everywhere the other tags do, visually distinguished in pink/red

### Out of Scope

A dedicated "family recipes" browsing page beyond the standard tag filter; per-tag custom colors for tags other than this one.

### Phase Status

- [ ] Phase Complete

---

## Phase 8 — Category → Subcategory → Tags Restructure (not scheduled)

### Goal

Move from a flat Category + cross-cutting Tags model to three levels: **Category → Subcategory → Tags**. Categories/subcategories represent the actual type of food; tags stay exactly as they are today (Za početnike, Bez glutena, Brzi recepti, Sezonski recepti, Vegetarijanski — confirmed the only 5 tags that exist) for characteristics that cut across multiple categories.

**Research findings**: zero recipes currently use the "Ostalo" category (confirmed against `seed.sql`, which doubles as production content per Phase 20) — retiring it needs no recipe reassignment. Adding "Predjela" and building category/tag admin CRUD is already planned in **Phase 6**; this phase coordinates with it rather than duplicating that work (subcategory admin CRUD ships alongside Phase 6's screen, not as a 4th admin surface).

**Subcategory list status — working draft, pending the user's revised list.** The list below already excludes cross-cutting entries that behave like tags rather than dish types (dropped per explicit decision): ~~Zdrav doručak~~ (a quality), ~~Jela iz rerne~~ (a cooking method), ~~Zimske salate~~ (seasonal — duplicates the existing "Sezonski recepti" tag). Known unresolved overlaps in what remains (flag for the user's revision, not blocking): "Namazi" appears under Doručak/Predjela/Prilozi; "Pite" means savory (Peciva) vs. sweet (Deserti); "Čorbe" duplicates its own parent category name and overlaps with "Mesne čorbe"/"Riblje čorbe"; "Glavna jela" and "Predjela" mix protein-type/carb-base/format axes that aren't mutually exclusive (e.g. a chicken stew matches multiple subcategories at once).

Working draft (9 categories, pending revision):
- **Doručak**: Jaja i omleti, Sendviči i tost, Kaše, Palačinke i uštipci, Namazi
- **Predjela**: Hladna predjela, Topla predjela, Kanapei i zalogaji, Namazi i dipovi, Predjela sa mesom, Predjela sa povrćem
- **Supe i čorbe**: Bistre supe, Krem supe / potaži, Čorbe, Mesne čorbe, Riblje čorbe, Povrtne supe
- **Glavna jela**: Piletina, Svinjetina, Junetina, Mleveno meso, Riba i morski plodovi, Testenine, Pirinač i rižoto, Jela od povrća, Variva
- **Salate**: Sveže salate, Obrok salate, Salate sa mesom, Salate sa testeninom, Krompir salate
- **Prilozi**: Krompir, Pirinač, Povrće, Testenina, Sosovi, Prelivi, Namazi
- **Peciva**: Hleb, Pogače, Kiflice, Pite i burek, Pizza, Slana peciva, Slatka peciva, Testa
- **Deserti**: Torte, Kolači, Sitni kolači, Pite, Kremasti deserti, Puding i mus, Sladoled, Voćni deserti
- **Pića i napici**: Limunade, Sokovi, Smoothie, Kafa, Čaj, Topli napici, Kokteli, Bezalkoholni kokteli

### Tasks

**MUST HAVE**
- [ ] Migration: new `subcategories` table (`id`, `category_id references categories(id) on delete restrict`, `slug`, `name_en`, `name_sr`, timestamps) + RLS mirroring the exact `{table}_public_select`/`{table}_authenticated_write` pattern used everywhere else
- [ ] Migration: nullable `recipes.subcategory_id references subcategories(id) on delete set null` — nullable because none of the 14 existing recipes have one yet and there's no way to auto-infer it from free text; admin backfills manually over time
- [ ] Seed the finalized subcategory list once the user provides their revision; exclude "ostalo" from the active category set (dormant row, no recipes reference it)
- [ ] `recipeQueries.ts`: add `subcategory:subcategories(slug, name_en, name_sr)` to `RECIPE_SUMMARY_SELECT`, mirroring the existing `category:categories(...)` embed exactly
- [ ] `types/recipe.ts`: add `subcategory: { slug, name_en, name_sr } | null` to `RecipeSummary`, mirroring the existing `category` field shape
- [ ] `recipeFormSchema.ts`/`recipeFormState.ts`/`useAdminRecipe.ts`'s `AdminRecipeDetail`: add `subcategory_id`, required for new/edited recipes (same `z.string().trim().min(1, ...)` pattern as `category_id`), plus validation that the chosen subcategory actually belongs to the chosen category
- [ ] New `useSubcategories()` hook mirroring `useCategories()` (fetch all ~50-60 rows once; trivially small dataset, no per-category queries needed)
- [ ] `RecipeForm.tsx`: subcategory `<select>` dependent on the category `<select>` — disabled/empty until a category is chosen, resets when category changes (new interaction pattern in this codebase, self-contained)
- [ ] `App.tsx`: new nested route `kategorije/:slug/:subcategorySlug`; `CategoryRecipesPage.tsx` gains subcategory-drill-down handling (it currently reads zero search params) and a subcategory filter-chip row reusing the existing tag-chip pill pattern
- [ ] `useRecipesByCategory.ts`: accept an optional subcategory slug and filter accordingly
- [ ] `AllRecipesPage.tsx`/`recipeFilter.ts`/`recipeSearchParams.ts`: add `subcategory` as an ad-hoc single-value query param (matching how `category`/`favorite` already work on this page, not the multi-value `tags` pattern), dependent select next to the category select

**NICE TO HAVE**
- [ ] Resolve the flagged naming overlaps ("Namazi" x3, "Pite" ambiguity, redundant "Čorbe") once the user's revised list lands
- [ ] Subcategory counts on `CategoriesPage`/category cards (mirrors the existing `recipes(count)` embed pattern in `useCategories.ts`)

**OPTIONAL FUTURE IMPROVEMENTS**
- [ ] Nested/expandable subcategory tree in the sidebar (deferred in favor of the simpler chip-row-on-category-page approach, to avoid a deep/cluttered nav on a personal app)
- [ ] Bulk recipe reassignment tooling for backfilling subcategories on the 14 pre-existing recipes

### Database / Supabase

- [ ] `subcategories` table + RLS; `recipes.subcategory_id` nullable FK, `on delete set null`

### UI / UX

- [ ] Clicking a category shows all its recipes (unchanged); clicking a subcategory chip narrows further via the nested route — no separate "loading" state regression
- [ ] Subcategory chip row and admin dependent-select both responsive at existing breakpoints (reuses already-established patterns, no new responsive work)

### Internationalization

- [ ] Subcategory names are bilingual (name_en/name_sr) database columns, consistent with categories/tags — no locale-file additions needed

### Testing & Verification

- [ ] Manual: category page subcategory chips filter correctly; clearing the subcategory returns to the full category view
- [ ] Manual: admin form's subcategory select correctly resets/repopulates when category changes
- [ ] Manual: a recipe with no subcategory (all 14 existing ones, until backfilled) still renders correctly everywhere

### Definition of Done

- [ ] Admin can assign a category + subcategory (+ optional tags) to any recipe; public browsing supports drilling into a category's subcategories and filtering `/recepti` by subcategory; existing recipes/tags are unaffected until reassigned

### Out of Scope

Automated backfill/inference of subcategories for existing recipes; a nested sidebar subcategory tree; per-recipe multiple subcategories (exactly one, like category); reordering categories/subcategories.

### Final architecture

```
Recipe
├── Category (1)
├── Subcategory (1, optional until assigned)
└── Tags (0..N)
```

### Phase Status

- [ ] Phase Complete

# Recipe Collection — Development Plan

See the master plan rationale (mockup analysis, schema design, i18n architecture, security model) for full context behind these phases. This file is the live progress tracker — update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: None active — Phases 1–6 are unscheduled backlog ideas
MVP Status: Complete

---

## Phase 1 — Ingredient Master-Catalog & Auto-Calculated Nutrition (not scheduled)

### Goal

A proper ingredient catalog (bilingual names, Latin name, category, a short educational fact, per-100g nutrition, image) that backs an autocomplete in the recipe ingredient editor, and drives automatic per-recipe/per-serving nutrition display on the recipe detail page — without requiring every existing free-text ingredient to be migrated up front. Supersedes the earlier "manual nutrition entry" idea: nutrition is calculated from linked ingredients rather than typed in per recipe.

### Tasks

- [ ] Migration: new `ingredient_categories` table (slug/name_en/name_sr), seeded with the 10 categories from the reference library (dairy, vegetables, misc/additives, fish-and-meat, sweets, oils-and-fats, vitamins-and-minerals, fruit, herbs-and-spices, grains)
- [ ] Migration: new `ingredients` table — name_en/name_sr, `latin_name` (single column, language-neutral), `regional_names` (free text), `fact_en`/`fact_sr` (short 1-2 sentence educational blurb, not full prose), `default_unit_en`/`default_unit_sr`, per-100g nutrition (`calories_kcal`, `protein_g`, `fat_g`, `carbs_g`, `fiber_g`), `micronutrients` jsonb (`{ "vitamin_b12": { "amount": 0.5, "unit": "µg" } }`), `unit_conversions` jsonb (`{ "kašika": 15, "čaša": 250 }` grams-per-unit), image fields (`image_storage_path`, `image_alt_en`, `image_alt_sr`)
- [ ] Migration: add nullable `recipe_ingredients.ingredient_id` FK (`on delete set null`) — keeps every existing free-text row valid; only catalog-linked rows contribute to nutrition
- [ ] `IngredientEditor`: autocomplete the name_en input against the catalog; selecting a suggestion sets `ingredient_id` and prefills name_sr/default unit; typing a non-match leaves `ingredient_id` null (free text, backward compatible) with an inline "add to catalog" affordance
- [ ] Extend `recipeFormSchema.ts`'s `ingredientSchema` with an optional `ingredient_id`, reusing the existing `optionalText`/`optionalNonNegativeNumber` validation idioms
- [ ] New `AdminIngredientsPage` (e.g. `/admin/sastojci`) — search/category-filter/pagination, mirroring `AdminRecipesPage`'s existing pattern
- [ ] Ingredient create/edit form: all catalog fields above, with micronutrients and unit_conversions as repeatable key/value rows (reuse the add/remove/reorder row-array pattern from `IngredientEditor.tsx`/`StepEditor.tsx`), plus image upload reusing `ImageManager.tsx` + `src/lib/storage.ts` (new Storage path prefix, e.g. `ingredient-images/`)
- [ ] New `src/lib/nutrition.ts`: pure functions computing recipe-total and per-serving nutrition from catalog-linked ingredients — grams-based (direct for g/kg units, via `unit_conversions` lookup otherwise; skip an ingredient from the total if no conversion exists rather than guessing), reusing the servings-scaling logic already in `src/lib/servings.ts`
- [ ] New `NutritionPanel` component rendered near `RecipeMeta` on `RecipeDetailPage` — hidden entirely if zero ingredients are catalog-linked; shows a "based on N of M ingredients" disclaimer when the calculation is partial

### Database / Supabase

- [ ] `ingredient_categories` + `ingredients` tables, RLS mirroring the `categories`/`tags` public-select/authenticated-write pattern
- [ ] `recipe_ingredients.ingredient_id` nullable FK, `on delete set null`

### UI / UX

- [ ] Autocomplete suggestions list is keyboard-navigable and dismissible
- [ ] Nutrition panel only renders when at least one ingredient is catalog-linked; recalculates reactively when the servings scaler changes

### Internationalization

- [ ] Catalog entries carry name_en/name_sr, fact_en/fact_sr, default_unit_en/sr like other bilingual fields; `latin_name`/`regional_names` are single (language-neutral / regional-Serbian) columns, not bilingual pairs

### Testing & Verification

- [ ] Unit tests for the nutrition calculation util (grams conversion, per-serving math, partial-ingredient disclaimer threshold)
- [ ] Manual: typing a known ingredient name shows matching suggestions; picking one fills the row and links `ingredient_id`
- [ ] Manual: nutrition panel updates correctly when the servings scaler changes

### Definition of Done

- [ ] Admin ingredient name inputs autocomplete from a shared catalog; recipes with catalog-linked ingredients show correct per-recipe/per-serving nutrition on the public detail page

### Out of Scope

Full-prose encyclopedia content or public ingredient detail pages (only the short `fact_en`/`fact_sr` blurb is shown); automatic unit conversion for units without an explicit `unit_conversions` entry; backfilling every existing recipe's free-text ingredients to catalog links (linking happens organically as recipes are edited); the bulk import of the user's ~200-item reference library and ongoing manual catalog entry are both deferred to when that content is actually provided — not part of this phase's build.

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

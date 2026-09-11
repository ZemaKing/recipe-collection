# Recipe Collection — Development Plan

See the master plan rationale (mockup analysis, schema design, i18n architecture, security model) for full context behind these phases. This file is the live progress tracker — update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: None active — Phases 1–4 are unscheduled backlog ideas
MVP Status: Complete

---

## Phase 1 — Nutrition Info Fields (not scheduled)

### Goal

Let recipes optionally carry basic nutrition info, shown only when present.

### Tasks

- [ ] Migration: add nullable nutrition columns to `recipes` (e.g. calories, protein_g, carbs_g, fat_g — per serving)
- [ ] Add nutrition fields to the admin `RecipeForm`
- [ ] Display nutrition on `RecipeDetailPage` / `RecipeMeta`, hidden entirely when a recipe has no nutrition data

### Database / Supabase

- [ ] New migration file adding nullable nutrition columns (no RLS changes — covered by existing recipes policies)

### UI / UX

- [ ] Nutrition block only renders when at least one value is set; no placeholder/zero values shown

### Internationalization

- [ ] Nutrition field labels localized (EN/SR)

### Testing & Verification

- [ ] Manual: create/edit a recipe with and without nutrition data, confirm detail page reflects both cases

### Definition of Done

- [ ] Admin can optionally set per-serving nutrition info; it displays on the public detail page only when present

### Out of Scope

Automatic nutrition calculation from ingredients, per-ingredient nutrition database.

### Phase Status

- [ ] Phase Complete

---

## Phase 2 — Ingredient Master-Catalog with Autocomplete (not scheduled)

### Goal

Reduce duplicate/inconsistent ingredient naming by backing the admin ingredient editor with a canonical catalog.

### Tasks

- [ ] Migration: new `ingredient_catalog` table (name_en, name_sr, default unit) + RLS (public read, admin write)
- [ ] `IngredientEditor`: autocomplete the name inputs against the catalog; selecting a suggestion fills name_en/name_sr (and unit, if empty)
- [ ] Allow adding a new catalog entry inline when typing an ingredient not yet in the catalog

### Database / Supabase

- [ ] New `ingredient_catalog` table + RLS policies mirroring the `categories`/`tags` read-open/write-admin pattern

### UI / UX

- [ ] Autocomplete suggestions list is keyboard-navigable and dismissible

### Internationalization

- [ ] Catalog entries carry both name_en/name_sr like other bilingual fields

### Testing & Verification

- [ ] Manual: typing a known ingredient name shows matching suggestions; picking one fills the row correctly

### Definition of Done

- [ ] Admin ingredient name inputs autocomplete from a shared catalog instead of being freeform every time

### Out of Scope

Backfilling/linking existing `recipe_ingredients` rows to catalog entries; ingredient-level nutrition.

### Phase Status

- [ ] Phase Complete

---

## Phase 3 — Postgres Full-Text Search (not scheduled)

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

## Phase 4 — Automated Storage Orphan-Sweep Job (not scheduled)

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

## Phase 5 — Favorites Page (not scheduled)

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

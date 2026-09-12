# Recipe Collection — Development Plan

See the master plan rationale (mockup analysis, schema design, i18n architecture, security model) for full context behind these phases. This file is the live progress tracker — update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: Phase 7 complete. Phases 2, 3, 6, 8 are unscheduled backlog ideas.
MVP Status: Complete

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

---

## Phase 32 — Postgres Full-Text Search (not scheduled)

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

## Phase 33 — Automated Storage Orphan-Sweep Job (not scheduled)

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

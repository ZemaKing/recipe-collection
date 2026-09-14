# Recipe Collection — Development Plan

See the master plan rationale (mockup analysis, schema design, i18n architecture, security model) for full context behind these phases. This file is the live progress tracker — update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: Phase 7, Phase 6, and Phase 8 complete. Phases 2, 3 are unscheduled backlog ideas.
MVP Status: Complete

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

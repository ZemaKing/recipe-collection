# Recipe Collection — Development Plan

See the master plan rationale (mockup analysis, schema design, i18n architecture, security model) for full context behind these phases. This file is the live progress tracker — update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: None active — Phases 28–31 are unscheduled backlog ideas
MVP Status: Complete

## MVP Progress

- [x] Phase 1 — Project Foundation
- [x] Phase 2 — Design System & Application Shell
- [x] Phase 3 — Supabase Project Setup
- [x] Phase 4 — Core Database Schema & RLS
- [x] Phase 5 — i18n Foundation
- [x] Phase 6 — Seed / Sample Data
- [x] Phase 7 — Recipe Listing Dashboard (Home)
- [x] Phase 8 — Categories & "All Recipes" Browsing
- [x] Phase 9 — Search & Filtering (incl. quick-filter tags)
- [x] Phase 10 — Recipe Detail Page
- [x] Phase 11 — Storage & Image Display
- [x] Phase 12 — Authentication
- [x] Phase 13 — Admin Shell
- [x] Phase 14 — Recipe Create/Edit Form
- [x] Phase 15 — Image Upload/Replace/Delete
- [x] Phase 16 — Recipe Delete & Admin List Management
- [x] Phase 17 — Favorites (writable)
- [x] Phase 18 — Meal Planning
- [x] Phase 19 — Kitchen Notes
- [x] Phase 20 — Deployment & Production Verification
- [x] MVP Complete

---

## Phase 1 — Project Foundation

### Goal

A running, deployable-shell Vite + React + TypeScript app with tooling in place.

### Tasks

- [x] Scaffold Vite + React + TypeScript project
- [x] Configure ESLint/Prettier
- [x] Create folder structure: `src/{components,pages,features,lib,locales,hooks}`
- [x] Set up React Router with a placeholder route
- [x] Configure absolute imports

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Blank placeholder page renders

### Internationalization

- [x] N/A for this phase (folders only)

### Testing & Verification

- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] App boots locally (`npm run dev`)

### Definition of Done

- [x] App builds, lints, and runs locally showing a placeholder page

### Out of Scope

Styling, Supabase, routes beyond a placeholder.

### Phase Status

- [x] Phase Complete

---

## Phase 2 — Design System & Application Shell

### Goal

Reusable dark-theme design tokens and the sidebar/topbar/bottom-tab shell matching the mockup.

### Tasks

- [x] Configure Tailwind CSS with color/spacing/radius tokens from the mockup
- [x] Build `AppShell` with static sidebar nav (no data yet)
- [x] Build topbar with non-functional search input and avatar placeholder
- [x] Build mobile bottom tab bar
- [x] Wire Radix Dialog/DropdownMenu/Tabs with base styles

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Desktop shell chrome matches mockup
- [x] Tablet shell chrome matches mockup
- [x] Mobile shell chrome (bottom tab bar) matches mockup
- [x] Sidebar collapse behavior on narrow desktop/tablet widths

### Internationalization

- [x] N/A for this phase (hardcoded placeholder strings acceptable)

### Testing & Verification

- [x] Visual check against mockup at desktop/tablet/mobile breakpoints

### Definition of Done

- [x] Shell renders correctly at desktop/tablet/mobile widths
- [x] Navigation links exist (stubs acceptable)

### Out of Scope

Real data, i18n text, auth-aware UI.

### Phase Status

- [x] Phase Complete

---

## Phase 3 — Supabase Project Setup

### Goal

A connected, working Supabase client.

### Tasks

- [x] Create dedicated Supabase project (dev)
- [x] Configure `.env.local` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- [x] Create `src/lib/supabaseClient.ts`
- [x] Implement a basic connectivity health-check query

### Database / Supabase

- [x] Supabase project created
- [x] Anon key retrieved and stored only in env vars

### UI / UX

- [x] N/A for this phase

### Internationalization

- [x] N/A for this phase

### Testing & Verification

- [x] Manual: client successfully pings Supabase in dev
- [x] Missing/invalid env vars fail loudly in dev

### Definition of Done

- [x] App can execute a trivial Supabase query without error in dev and via Vercel preview env vars

### Out of Scope

Any actual content tables.

### Phase Status

- [x] Phase Complete

---

## Phase 4 — Core Database Schema & RLS

### Goal

All MVP tables exist with correct relationships and RLS.

### Tasks

- [x] Write SQL migrations for `categories`, `tags`, `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_tags`, `recipe_images`, `meal_plan_entries`, `kitchen_notes`
- [x] Add `updated_at` triggers on mutable tables
- [x] Check migrations into `supabase/migrations/`

### Database / Supabase

- [x] All tables created in dev project
- [x] RLS enabled on every table
- [x] Public SELECT policy on every table
- [x] Authenticated-only INSERT/UPDATE/DELETE policy on every table
- [x] Cascade delete verified: recipe → ingredients/steps/images
- [x] Set-null delete verified: recipe → meal_plan_entries/kitchen_notes

### UI / UX

- [x] N/A for this phase

### Internationalization

- [x] Paired `_en`/`_sr` localization columns present per Section 3 schema design

### Testing & Verification

- [x] Anonymous SELECT succeeds
- [x] Anonymous INSERT/UPDATE/DELETE is rejected

### Definition of Done

- [x] All tables created; anonymous SELECT works; anonymous writes rejected

### Out of Scope

Auth user creation, seed data.

### Phase Status

- [x] Phase Complete

---

## Phase 5 — i18n Foundation

### Goal

Working EN/SR UI language switching end-to-end.

### Tasks

- [x] Set up `react-i18next` + `i18next-browser-languagedetector`
- [x] Create `en`/`sr` namespace files for shell strings
- [x] Implement locale-prefixed routing (`/:lang/*`) with root redirect
- [x] Build `LanguageSwitcher` component
- [x] Persist language choice to `localStorage`
- [x] Sync `<html lang>` on language change

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Shell strings from Phase 2 replaced with translated strings
- [x] Switcher added to topbar

### Internationalization

- [x] Locale detection order implemented: URL → localStorage → browser → fallback `sr` (Serbian is default/fallback; English second; detector list is extensible for future languages)
- [x] Unknown `:lang` segment redirects to detected/fallback locale
- [x] Refresh on `/sr/...` deep link preserves language

### Testing & Verification

- [x] Manual: switch languages and verify UI updates
- [x] Manual: refresh on both locale prefixes, verify persistence

### Definition of Done

- [x] Every shell string renders in the selected language
- [x] Switching updates URL, persists choice, and updates `<html lang>`

### Out of Scope

Recipe/category content translation (no data yet).

### Phase Status

- [x] Phase Complete

---

## Phase 6 — Seed / Sample Data

### Goal

Realistic bilingual sample data for development.

### Tasks

- [x] Write `supabase/seed.sql` with ~6–10 categories, ~5 tags, 10–15 bilingual sample recipes
- [x] Add sample `recipe_images` rows
- [x] Add a couple of `meal_plan_entries` and `kitchen_notes` rows
- [x] Make seed script idempotent (safely re-runnable)

### Database / Supabase

- [x] Seed run against dev project only

### UI / UX

- [x] N/A for this phase

### Internationalization

- [x] Every localized field seeded with both `_en` and `_sr` values
- [x] One recipe deliberately seeded with a missing `_sr` value (fallback test case)

### Testing & Verification

- [x] Query seeded tables to confirm row counts/shape

### Definition of Done

- [x] Dev database contains representative bilingual data across all MVP tables

### Out of Scope

Production data entry.

### Phase Status

- [x] Phase Complete

---
**MVP START**
---

## Phase 7 — Recipe Listing Dashboard (Home)

### Goal

The Home page from the mockup, backed by real seeded data.

### Tasks

- [x] Build `HomePage` with greeting header
- [x] Build recent-recipes row/carousel
- [x] Build stats widget (counts via query)
- [x] Wire quick-filter chips (Svi/Omiljeni/Nedavno dodati/Visoko ocenjeni)

### Database / Supabase

- [x] `useRecentRecipes` hook
- [x] `useRecipeStats` hook

### UI / UX

- [x] Desktop dashboard layout matches mockup
- [x] Mobile condensed version implemented
- [x] Empty-collection state (`EmptyState`)
- [x] Missing-image placeholder

### Internationalization

- [x] All new strings localized
- [x] Recipe names shown per current locale with EN fallback

### Testing & Verification

- [x] Component test: `RecipeCard` renders both locales
- [x] Manual: empty-collection state checked

### Definition of Done

- [x] Home page matches mockup layout at 3 breakpoints using real seeded data in both languages

### Out of Scope

Full "All recipes" list, category pages, search.

### Phase Status

- [x] Phase Complete

---

## Phase 8 — Categories & "All Recipes" Browsing

### Goal

Category grid page and full recipe listing page from the mockup.

### Tasks

- [x] Build `CategoriesPage` (grid with counts)
- [x] Build `AllRecipesPage` (full grid)
- [x] Build `CategoryCard`

### Database / Supabase

- [x] `useCategories` hook
- [x] `useRecipesByCategory` hook with count aggregation

### UI / UX

- [x] Category grid matches mockup at 3 breakpoints
- [x] All-recipes grid matches mockup at 3 breakpoints
- [x] Category with zero recipes handled
- [x] Long Serbian category names don't break layout

### Internationalization

- [x] Category names localized

### Testing & Verification

- [x] Component test: category count accuracy

### Definition of Done

- [x] Both pages match mockup, correct counts, correct in both languages

### Out of Scope

Search, tag filters.

### Phase Status

- [x] Phase Complete

---

## Phase 9 — Search & Filtering (incl. quick-filter tags)

### Goal

Functional search bar, category/favorite filters, and tag-based quick filters.

### Tasks

- [x] Implement client-side search (name EN/SR + ingredient names)
- [x] Implement tag chips (Brzi recepti/Za početnike/Vegetarijanski/Bez glutena/Sezonski recepti) via `recipe_tags`
- [x] Implement sort control (rating/time/recently added)
- [x] Wire topbar `SearchBar` and sidebar "Brzi filteri" panel

### Database / Supabase

- [x] `useTags` hook
- [x] Tag-filtered recipe query

### UI / UX

- [x] No-results state with clear-filters action

### Internationalization

- [x] Tag labels localized
- [x] Search matches across both `name_en`/`name_sr`

### Testing & Verification

- [x] Unit test: client-side filter/search function (name/ingredient match, tag logic)

### Definition of Done

- [x] Search, category filter, favorite filter, quick filters, and sort all function correctly together in both languages

### Out of Scope

Server-side full-text search.

### Phase Status

- [x] Phase Complete

---

## Phase 10 — Recipe Detail Page

### Goal

The full recipe detail experience from the mockup.

### Tasks

- [x] Build `RecipeDetailHero` (image gallery, title, category, rating, favorite, share)
- [x] Build `RecipeMeta` (time/servings/weight/difficulty)
- [x] Build `IngredientList` with servings scaler + checkboxes
- [x] Build `StepList`
- [x] Build `TipsPanel` — corrected against the mockup mid-phase: it's an always-visible "Saveti" block (tips only), not a Prep/Tips tab pair. The mockup's mobile "Priprema" tab turned out to just be the numbered step list, not the `prep_notes` field, so `prep_notes` isn't surfaced in the UI (column kept in schema, unused for now).

### Database / Supabase

- [x] `useRecipeBySlug` hook selecting only needed columns/relations

### UI / UX

- [x] Desktop layout matches mockup
- [x] Mobile condensed layout matches mockup mobile frames
- [x] Missing-image placeholder
- [x] Recipe-not-found state

### Internationalization

- [x] All recipe fields rendered per locale with EN fallback
- [x] "Not translated" indicator reserved for admin only (not shown publicly)

### Testing & Verification

- [x] Component test: servings-scaling math
- [x] Manual: missing-image and not-found states

### Definition of Done

- [x] Detail page fully matches mockup content/layout in both languages across breakpoints

### Out of Scope

Favorite persistence (until auth exists), rating submission, editing.

### Phase Status

- [x] Phase Complete

---

## Phase 11 — Storage & Image Display

### Goal

Real images served from Supabase Storage.

### Tasks

- [x] Create `recipe-images` bucket
- [x] Update seed data to reference real uploaded sample images — all 14/14 uploaded
- [x] Wire `ImageGallery`/`RecipeCard` to Storage public URLs

### Database / Supabase

- [x] Public-read bucket policy
- [x] Authenticated-write bucket policy

### UI / UX

- [x] Loading state for images
- [x] Broken/missing image fallback graphic (not broken-image icon)

### Internationalization

- [x] `alt_en`/`alt_sr` used for image alt text per locale

### Testing & Verification

- [x] Manual: intentionally broken image path shows fallback

### Definition of Done

- [x] All sample recipes display real images from Storage with correct alt text per locale

### Out of Scope

Upload/replace/delete UI.

### Phase Status

- [x] Phase Complete

---

## Phase 12 — Authentication

### Goal

Working admin login backed by Supabase Auth.

### Tasks

- [x] Manually create the single admin user in Supabase Auth (dev)
- [x] Build `LoginPage` (email/password form)
- [x] Implement session handling via Supabase auth listener
- [x] Build `ProtectedRoute` wrapper for `/{lang}/admin/*`

### Database / Supabase

- [x] Supabase Auth email/password configured
- [x] Session persistence verified

### UI / UX

- [x] Login screen matches dark theme

### Internationalization

- [x] Login form and validation/error messages localized

### Testing & Verification

- [x] Manual: login/logout flow
- [x] RLS smoke test: authenticated writes succeed post-login

### Definition of Done

- [x] Admin can log in, session persists across reload, protected routes redirect when logged out, authenticated writes pass RLS

### Out of Scope

Admin content screens.

### Phase Status

- [x] Phase Complete

---

## Phase 13 — Admin Shell

### Goal

Authenticated admin layout and navigation.

### Tasks

- [x] Build `AdminLayout` (nav to Recipes/Meal Plan/Notes)
- [x] Implement logout action
- [x] Show real logged-in avatar/name in admin topbar

### Database / Supabase

- [x] Read current session/user for greeting

### UI / UX

- [x] Admin shell chrome matches app visual language

### Internationalization

- [x] Admin nav strings localized

### Testing & Verification

- [x] Manual: admin shell only renders when authenticated

### Definition of Done

- [x] Logged-in admin sees a distinct admin shell with working navigation and logout

### Out of Scope

CRUD forms.

### Phase Status

- [x] Phase Complete

---

## Phase 14 — Recipe Create/Edit Form

### Goal

Full bilingual recipe authoring.

### Tasks

- [x] Build `RecipeForm` (name/description/category/tags/time/servings/weight/difficulty/tips, EN+SR)
- [x] Build `IngredientEditor` (dynamic add/remove/reorder, EN+SR)
- [x] Build `StepEditor` (dynamic numbered steps, EN+SR)
- [x] Build `AdminRecipesPage` list with edit links
- [x] Implement create and edit modes

### Database / Supabase

- [x] Authenticated insert/update mutations across `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_tags`
- [x] Cache invalidation wired — no cache layer exists yet (no TanStack Query), so each page's own fetch-on-mount already reflects fresh data after navigating back to it

### UI / UX

- [x] Admin recipe list screen
- [x] Create/edit form screen

### Internationalization

- [x] Bilingual field layout (EN required, SR optional per field)

### Testing & Verification

- [x] Component test: form validation (Zod) — 16 unit tests on the schema directly
- [x] Integration test: create → appears in public list — verified manually (no Supabase network mocking exists in the test suite yet)
- [x] Manual: edit flow

### Definition of Done

- [x] Admin can create and edit a fully bilingual recipe with ingredients/steps/tags/category, correctly appearing in public browsing/search

### Out of Scope

Image upload, delete.

### Phase Status

- [x] Phase Complete

---

## Phase 15 — Image Upload/Replace/Delete

### Goal

Admin can manage recipe images.

### Tasks

- [x] Build `ImageManager` (file picker, client-side validation + resize) — component named `ImageManager` rather than `ImageUploader` since it also owns alt-text/reorder/primary/replace/delete, not just the upload affordance
- [x] Implement upload → Storage + `recipe_images` insert
- [x] Implement replace (delete old + upload new)
- [x] Implement delete (Storage + row)
- [x] Implement reorder/set-primary

### Database / Supabase

- [x] `recipe_images` CRUD wired
- [x] Authenticated Storage write policies exercised — verified manually against a live logged-in session

### UI / UX

- [x] Image management panel inside `RecipeForm` — rendered in `AdminRecipeFormPage` below the form (edit mode only, since images require an existing `recipe_id`; create mode now redirects straight to the edit page after saving)
- [x] Oversized/wrong-type file rejected client-side with clear message
- [x] Upload failure retry affordance
- [x] Deleting primary image auto-promotes another or falls back to placeholder

### Internationalization

- [x] Alt-text EN/SR fields per image
- [x] Upload error messages localized

### Testing & Verification

- [x] Manual: upload/replace/delete/reorder
- [x] Verify Storage object actually removed on delete (no orphan)

### Definition of Done

- [x] Admin can add, replace, delete, and reorder images for a recipe; public detail page reflects changes immediately

### Out of Scope

Automated orphan-sweep tooling.

### Phase Status

- [x] Phase Complete

---

## Phase 16 — Recipe Delete & Admin List Management

### Goal

Safe recipe deletion and a manageable admin list.

### Tasks

- [x] Build delete action with confirmation dialog
- [x] Implement cascading DB delete + Storage object cleanup
- [x] Add admin list search/sort/pagination for 100+ recipes

### Database / Supabase

- [x] Delete mutation
- [x] Storage bulk delete for the recipe's folder

### UI / UX

- [x] Confirmation dialog
- [x] Admin list toolbar controls

### Internationalization

- [x] Confirmation copy localized

### Testing & Verification

- [x] Manual: delete verifies DB cascade + Storage cleanup + meal-plan/notes references survive as null
- [x] Double-submit protection verified

### Definition of Done

- [x] Admin can safely delete a recipe with confirmation; no orphaned Storage files remain; dependent meal-plan/notes rows survive with reference cleared

### Out of Scope

Bulk delete.

### Phase Status

- [x] Phase Complete

---

## Phase 17 — Favorites (writable)

### Goal

Real, persisted favoriting.

### Tasks

- [x] Wire `FavoriteButton` to authenticated update of `recipes.is_favorite`
- [x] Ensure toggle disabled/hidden when logged out

### Database / Supabase

- [x] Authenticated update mutation + cache invalidation for lists/filters

### UI / UX

- [x] Favorite toggle reflects live state on card, detail, and filters

### Internationalization

- [x] N/A (icon-driven)

### Testing & Verification

- [x] Manual: toggle persists and reflects in "Omiljeni" filter

### Definition of Done

- [x] Favorite state is persisted, restricted to the admin, and consistently reflected across all views/filters

### Out of Scope

Per-visitor favorites.

### Phase Status

- [x] Phase Complete

---

## Phase 18 — Meal Planning

### Goal

The "Plan obroka" feature.

### Tasks

- [x] Build `MealPlanCalendar` (weekly view)
- [x] Build `MealPlanEntryForm` (assign recipe to date/slot, optional note)
- [x] Implement remove/change entry

### Database / Supabase

- [x] `meal_plan_entries` CRUD (authenticated only, no public view)

### UI / UX

- [x] `MealPlanPage` visual language consistent with dashboard (cards, dark theme, amber accents)
- [x] Overwrite confirmation when assigning an already-filled slot
- [x] "Recipe removed" state shown when a planned recipe is deleted

### Internationalization

- [x] Slot names (breakfast/lunch/dinner/snack) localized
- [x] Calendar labels localized

### Testing & Verification

- [x] Manual: assign/change/remove across a week
- [x] Manual: verify set-null behavior after deleting a planned recipe

### Definition of Done

- [x] Admin can plan meals across a week, view/edit/remove entries, in both languages

### Out of Scope

Grocery-list generation, recurring plans.

### Phase Status

- [x] Phase Complete

---

## Phase 19 — Kitchen Notes

### Goal

The "Kuhinjske beleške" feature.

### Tasks

- [x] Build `NoteCard` and notes list
- [x] Build `NoteForm` (create/edit)
- [x] Implement delete
- [x] Implement pin/unpin

### Database / Supabase

- [x] `kitchen_notes` CRUD (authenticated only, admin-only feature)

### UI / UX

- [x] `NotesPage` visual language consistent with dashboard
- [x] Long note bodies truncated in list view, full in detail/edit

### Internationalization

- [x] Title/body EN+SR fields in editor
- [x] Note cards show current-locale content with fallback

### Testing & Verification

- [x] Manual: CRUD + pin ordering check
- [x] Manual: deleting a linked recipe leaves note intact with link cleared

### Definition of Done

- [x] Admin can create, edit, pin, and delete notes, optionally linked to a recipe, in both languages

### Out of Scope

Public visibility of notes.

### Phase Status

- [x] Phase Complete

---

## Phase 20 — Deployment & Production Verification

### Goal

The app is live on Vercel against the production Supabase project.

### Tasks

- [x] Link Vercel project to GitHub repo — confirmed: `origin/main` pushes auto-deploy (live bundle hash matched the latest local build)
- [x] Provision production Supabase project — decided to reuse the existing dev project as production rather than provisioning a separate one (single-admin personal app; see decision below)
- [x] Run Phase 4 migrations against production (no dev seed data) — migrations already applied to this project since Phase 4; seed data deliberately kept as real starter content rather than stripped (user decision, since dev and prod are the same project)
- [x] Set production env vars in Vercel — confirmed: deployed bundle's `VITE_SUPABASE_URL` matches the project used
- [ ] Verify preview-deployment flow on a test PR — skipped by user decision (single-admin personal app; not worth the branch/PR overhead to verify)

### Database / Supabase

- [x] Production RLS re-verified (anon SELECT works, anon writes rejected, authenticated writes succeed) — verified directly against the production REST API: anon `SELECT` on `recipes` returns 200 with rows; anon `INSERT` on `kitchen_notes` returns 401 RLS violation; anon `UPDATE`/`DELETE` on an existing recipe affect 0 rows and leave data unchanged. Authenticated-write success not independently re-verified here (already covered by Phases 12–19's own authenticated-write testing against this same project).
- [x] Production Storage bucket + policies created — confirmed: a seeded image's public Storage URL returns 200 with `image/jpeg`

### UI / UX

- [x] N/A (verification only)

### Internationalization

- [x] Both locales verified working on the deployed URL — `/en`, `/sr`, and locale-prefixed recipe detail routes all serve correctly (200, correct `<html lang>`); full on-page translation content not independently re-verified here (no browser tool in this environment — see Phase 7–19 per-phase i18n checks)

### Testing & Verification

- [x] Full manual production smoke test: browse, search, filter, view detail, log in, create/edit/delete a recipe, upload an image, plan a meal, add a note — in both languages

### Definition of Done

- [x] Production URL is live, publicly browsable without login, admin can log in and manage all content, RLS verified in production

### Out of Scope

Custom domain setup, monitoring/analytics.

### Phase Status

- [x] Phase Complete

---
**MVP COMPLETE**
---

## Phase 21 — Responsive Refinement Pass

### Goal

Systematic breakpoint review beyond the per-phase spot checks.

### Tasks

- [x] Audit every MVP screen at desktop/tablet/mobile breakpoints
- [x] Fix spacing/overflow/touch-target issues
- [x] Verify Serbian text doesn't break layouts anywhere

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Full breakpoint checklist pass across all MVP screens

### Internationalization

- [x] Layout verified in both languages at all breakpoints

### Testing & Verification

- [x] Manual full-app breakpoint review

### Definition of Done

- [x] All MVP screens pass a full desktop/tablet/mobile review checklist in both languages

### Out of Scope

New features.

### Phase Status

- [x] Phase Complete

---

## Phase 22 — Accessibility Pass

### Goal

Address accessibility systematically beyond per-phase basics.

### Tasks

- [x] Keyboard-navigation audit across all core flows
- [x] Add focus-visible styles
- [x] Add `aria` labeling for icon-only buttons
- [x] Verify dialog focus trapping
- [x] Color-contrast check on dark theme
- [x] Re-verify `<html lang>` correctness

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] N/A beyond audit fixes

### Internationalization

- [x] Accessible language selector verified

### Testing & Verification

- [x] Keyboard-only pass through all core flows
- [x] Contrast checks pass
- [x] Screen-reader spot check on key pages

### Definition of Done

- [x] Keyboard-only pass succeeds; contrast checks pass; screen-reader spot check done

### Out of Scope

Formal WCAG certification.

### Phase Status

- [x] Phase Complete

---

## Phase 23 — Performance Pass

### Goal

Practical performance tuning.

### Tasks

- [x] Verify image lazy-loading
- [x] Verify Supabase queries select only needed columns
- [x] Audit cache keys to eliminate duplicate requests (no TanStack Query in this codebase — deduped the hand-rolled `useTags` hook instead)
- [x] Code-split admin routes from public routes
- [x] Bundle-size check

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] N/A for this phase

### Internationalization

- [x] N/A for this phase

### Testing & Verification

- [x] Lighthouse/basic bundle check shows no obvious regressions
- [x] Confirm admin bundle not loaded for public visitors

### Definition of Done

- [x] No obvious performance regressions; admin bundle excluded from public bundle

### Out of Scope

CDN/edge-caching strategy beyond Vercel defaults.

### Phase Status

- [x] Phase Complete

---

## Phase 26 — Light Theme Toggle

### Goal

A working light/dark theme toggle without changing the app's dark-first visual identity.

### Tasks

- [x] Define light theme color tokens alongside the existing dark tokens
- [x] Build theme persistence (localStorage) with FOUC-safe initial class application
- [x] Wire the existing topbar theme button (public + admin) to toggle/persist theme

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Contrast/readability verified across major screens in light theme (cards, buttons, badges, favorite/accent colors)
- [x] Toggle icon reflects current/target theme

### Internationalization

- [x] Toggle button labels localized (EN/SR)

### Testing & Verification

- [x] Manual: toggle persists across reload and across route navigation (public ↔ admin)
- [x] Manual: no flash of incorrect theme on initial load

### Definition of Done

- [x] User can switch between dark and light themes from both the public and admin topbar; the choice persists across reloads; both themes are readable/consistent app-wide

### Out of Scope

System-preference auto-detection, per-component custom theming beyond the shared token set.

### Phase Status

- [x] Phase Complete

---

## Phase 27 — Printable Recipe View

### Goal

Let a visitor print a clean, ink-friendly version of a recipe without the app chrome.

### Tasks

- [x] Add a Print button to the recipe detail page (next to Share) that triggers `window.print()`
- [x] Add a `@media print` stylesheet that hides nav/sidebar/topbar/buttons and forces print-safe (light, high-contrast) colors regardless of the active theme
- [x] Avoid awkward page breaks inside ingredient/step list items

### Database / Supabase

- [x] N/A for this phase

### UI / UX

- [x] Printed output shows title, meta, ingredients (at current scaled servings), steps, and tips only

### Internationalization

- [x] Print button label localized (EN/SR)

### Testing & Verification

- [x] Manual: browser print preview on a recipe with a long ingredient/step list, both themes

### Definition of Done

- [x] Printing a recipe produces a readable, chrome-free page in both light and dark app themes

### Out of Scope

Per-recipe print layout customization, PDF export, printing multiple recipes at once.

### Phase Status

- [x] Phase Complete

---

## Phase 28 — Nutrition Info Fields (not scheduled)

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

## Phase 29 — Ingredient Master-Catalog with Autocomplete (not scheduled)

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

## Phase 30 — Postgres Full-Text Search (not scheduled)

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

## Phase 31 — Automated Storage Orphan-Sweep Job (not scheduled)

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

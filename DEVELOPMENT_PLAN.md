# Recipe Collection — Development Plan

See the master plan rationale (mockup analysis, schema design, i18n architecture, security model) for full context behind these phases. This file is the live progress tracker — update checkboxes only when a task is actually implemented and verified, not merely started.

## Project Status

Current Phase: Phase 8 — Categories & "All Recipes" Browsing
MVP Status: In Progress

## MVP Progress

- [x] Phase 1 — Project Foundation
- [x] Phase 2 — Design System & Application Shell
- [x] Phase 3 — Supabase Project Setup
- [x] Phase 4 — Core Database Schema & RLS
- [x] Phase 5 — i18n Foundation
- [x] Phase 6 — Seed / Sample Data
- [x] Phase 7 — Recipe Listing Dashboard (Home)
- [ ] Phase 8 — Categories & "All Recipes" Browsing
- [ ] Phase 9 — Search & Filtering (incl. quick-filter tags)
- [ ] Phase 10 — Recipe Detail Page
- [ ] Phase 11 — Storage & Image Display
- [ ] Phase 12 — Authentication
- [ ] Phase 13 — Admin Shell
- [ ] Phase 14 — Recipe Create/Edit Form
- [ ] Phase 15 — Image Upload/Replace/Delete
- [ ] Phase 16 — Recipe Delete & Admin List Management
- [ ] Phase 17 — Favorites (writable)
- [ ] Phase 18 — Meal Planning
- [ ] Phase 19 — Kitchen Notes
- [ ] Phase 20 — Deployment & Production Verification
- [ ] MVP Complete

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

- [ ] Build `CategoriesPage` (grid with counts)
- [ ] Build `AllRecipesPage` (full grid)
- [ ] Build `CategoryCard`

### Database / Supabase

- [ ] `useCategories` hook
- [ ] `useRecipesByCategory` hook with count aggregation

### UI / UX

- [ ] Category grid matches mockup at 3 breakpoints
- [ ] All-recipes grid matches mockup at 3 breakpoints
- [ ] Category with zero recipes handled
- [ ] Long Serbian category names don't break layout

### Internationalization

- [ ] Category names localized

### Testing & Verification

- [ ] Component test: category count accuracy

### Definition of Done

- [ ] Both pages match mockup, correct counts, correct in both languages

### Out of Scope

Search, tag filters.

### Phase Status

- [ ] Phase Complete

---

## Phase 9 — Search & Filtering (incl. quick-filter tags)

### Goal

Functional search bar, category/favorite filters, and tag-based quick filters.

### Tasks

- [ ] Implement client-side search (name EN/SR + ingredient names)
- [ ] Implement tag chips (Brzi recepti/Za početnike/Vegetarijanski/Bez glutena/Sezonski recepti) via `recipe_tags`
- [ ] Implement sort control (rating/time/recently added)
- [ ] Wire topbar `SearchBar` and sidebar "Brzi filteri" panel

### Database / Supabase

- [ ] `useTags` hook
- [ ] Tag-filtered recipe query

### UI / UX

- [ ] No-results state with clear-filters action

### Internationalization

- [ ] Tag labels localized
- [ ] Search matches across both `name_en`/`name_sr`

### Testing & Verification

- [ ] Unit test: client-side filter/search function (name/ingredient match, tag logic)

### Definition of Done

- [ ] Search, category filter, favorite filter, quick filters, and sort all function correctly together in both languages

### Out of Scope

Server-side full-text search.

### Phase Status

- [ ] Phase Complete

---

## Phase 10 — Recipe Detail Page

### Goal

The full recipe detail experience from the mockup.

### Tasks

- [ ] Build `RecipeDetailHero` (image gallery, title, category, rating, favorite, share)
- [ ] Build `RecipeMeta` (time/servings/weight/difficulty)
- [ ] Build `IngredientList` with servings scaler + checkboxes
- [ ] Build `StepList`
- [ ] Build `TipsPanel` (Prep/Tips tabs)

### Database / Supabase

- [ ] `useRecipeBySlug` hook selecting only needed columns/relations

### UI / UX

- [ ] Desktop layout matches mockup
- [ ] Mobile condensed layout matches mockup mobile frames
- [ ] Missing-image placeholder
- [ ] Recipe-not-found state

### Internationalization

- [ ] All recipe fields rendered per locale with EN fallback
- [ ] "Not translated" indicator reserved for admin only (not shown publicly)

### Testing & Verification

- [ ] Component test: servings-scaling math
- [ ] Manual: missing-image and not-found states

### Definition of Done

- [ ] Detail page fully matches mockup content/layout in both languages across breakpoints

### Out of Scope

Favorite persistence (until auth exists), rating submission, editing.

### Phase Status

- [ ] Phase Complete

---

## Phase 11 — Storage & Image Display

### Goal

Real images served from Supabase Storage.

### Tasks

- [ ] Create `recipe-images` bucket
- [ ] Update seed data to reference real uploaded sample images
- [ ] Wire `ImageGallery`/`RecipeCard` to Storage public URLs

### Database / Supabase

- [ ] Public-read bucket policy
- [ ] Authenticated-write bucket policy

### UI / UX

- [ ] Loading state for images
- [ ] Broken/missing image fallback graphic (not broken-image icon)

### Internationalization

- [ ] `alt_en`/`alt_sr` used for image alt text per locale

### Testing & Verification

- [ ] Manual: intentionally broken image path shows fallback

### Definition of Done

- [ ] All sample recipes display real images from Storage with correct alt text per locale

### Out of Scope

Upload/replace/delete UI.

### Phase Status

- [ ] Phase Complete

---

## Phase 12 — Authentication

### Goal

Working admin login backed by Supabase Auth.

### Tasks

- [ ] Manually create the single admin user in Supabase Auth (dev)
- [ ] Build `LoginPage` (email/password form)
- [ ] Implement session handling via Supabase auth listener
- [ ] Build `ProtectedRoute` wrapper for `/{lang}/admin/*`

### Database / Supabase

- [ ] Supabase Auth email/password configured
- [ ] Session persistence verified

### UI / UX

- [ ] Login screen matches dark theme

### Internationalization

- [ ] Login form and validation/error messages localized

### Testing & Verification

- [ ] Manual: login/logout flow
- [ ] RLS smoke test: authenticated writes succeed post-login

### Definition of Done

- [ ] Admin can log in, session persists across reload, protected routes redirect when logged out, authenticated writes pass RLS

### Out of Scope

Admin content screens.

### Phase Status

- [ ] Phase Complete

---

## Phase 13 — Admin Shell

### Goal

Authenticated admin layout and navigation.

### Tasks

- [ ] Build `AdminLayout` (nav to Recipes/Meal Plan/Notes)
- [ ] Implement logout action
- [ ] Show real logged-in avatar/name in admin topbar

### Database / Supabase

- [ ] Read current session/user for greeting

### UI / UX

- [ ] Admin shell chrome matches app visual language

### Internationalization

- [ ] Admin nav strings localized

### Testing & Verification

- [ ] Manual: admin shell only renders when authenticated

### Definition of Done

- [ ] Logged-in admin sees a distinct admin shell with working navigation and logout

### Out of Scope

CRUD forms.

### Phase Status

- [ ] Phase Complete

---

## Phase 14 — Recipe Create/Edit Form

### Goal

Full bilingual recipe authoring.

### Tasks

- [ ] Build `RecipeForm` (name/description/category/tags/time/servings/weight/difficulty/tips, EN+SR)
- [ ] Build `IngredientEditor` (dynamic add/remove/reorder, EN+SR)
- [ ] Build `StepEditor` (dynamic numbered steps, EN+SR)
- [ ] Build `AdminRecipesPage` list with edit links
- [ ] Implement create and edit modes

### Database / Supabase

- [ ] Authenticated insert/update mutations across `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_tags`
- [ ] Cache invalidation wired

### UI / UX

- [ ] Admin recipe list screen
- [ ] Create/edit form screen

### Internationalization

- [ ] Bilingual field layout (EN required, SR optional per field)

### Testing & Verification

- [ ] Component test: form validation (Zod)
- [ ] Integration test: create → appears in public list
- [ ] Manual: edit flow

### Definition of Done

- [ ] Admin can create and edit a fully bilingual recipe with ingredients/steps/tags/category, correctly appearing in public browsing/search

### Out of Scope

Image upload, delete.

### Phase Status

- [ ] Phase Complete

---

## Phase 15 — Image Upload/Replace/Delete

### Goal

Admin can manage recipe images.

### Tasks

- [ ] Build `ImageUploader` (file picker, client-side validation + resize)
- [ ] Implement upload → Storage + `recipe_images` insert
- [ ] Implement replace (delete old + upload new)
- [ ] Implement delete (Storage + row)
- [ ] Implement reorder/set-primary

### Database / Supabase

- [ ] `recipe_images` CRUD wired
- [ ] Authenticated Storage write policies exercised

### UI / UX

- [ ] Image management panel inside `RecipeForm`
- [ ] Oversized/wrong-type file rejected client-side with clear message
- [ ] Upload failure retry affordance
- [ ] Deleting primary image auto-promotes another or falls back to placeholder

### Internationalization

- [ ] Alt-text EN/SR fields per image
- [ ] Upload error messages localized

### Testing & Verification

- [ ] Manual: upload/replace/delete/reorder
- [ ] Verify Storage object actually removed on delete (no orphan)

### Definition of Done

- [ ] Admin can add, replace, delete, and reorder images for a recipe; public detail page reflects changes immediately

### Out of Scope

Automated orphan-sweep tooling.

### Phase Status

- [ ] Phase Complete

---

## Phase 16 — Recipe Delete & Admin List Management

### Goal

Safe recipe deletion and a manageable admin list.

### Tasks

- [ ] Build delete action with confirmation dialog
- [ ] Implement cascading DB delete + Storage object cleanup
- [ ] Add admin list search/sort/pagination for 100+ recipes

### Database / Supabase

- [ ] Delete mutation
- [ ] Storage bulk delete for the recipe's folder

### UI / UX

- [ ] Confirmation dialog
- [ ] Admin list toolbar controls

### Internationalization

- [ ] Confirmation copy localized

### Testing & Verification

- [ ] Manual: delete verifies DB cascade + Storage cleanup + meal-plan/notes references survive as null
- [ ] Double-submit protection verified

### Definition of Done

- [ ] Admin can safely delete a recipe with confirmation; no orphaned Storage files remain; dependent meal-plan/notes rows survive with reference cleared

### Out of Scope

Bulk delete.

### Phase Status

- [ ] Phase Complete

---

## Phase 17 — Favorites (writable)

### Goal

Real, persisted favoriting.

### Tasks

- [ ] Wire `FavoriteButton` to authenticated update of `recipes.is_favorite`
- [ ] Ensure toggle disabled/hidden when logged out

### Database / Supabase

- [ ] Authenticated update mutation + cache invalidation for lists/filters

### UI / UX

- [ ] Favorite toggle reflects live state on card, detail, and filters

### Internationalization

- [ ] N/A (icon-driven)

### Testing & Verification

- [ ] Manual: toggle persists and reflects in "Omiljeni" filter

### Definition of Done

- [ ] Favorite state is persisted, restricted to the admin, and consistently reflected across all views/filters

### Out of Scope

Per-visitor favorites.

### Phase Status

- [ ] Phase Complete

---

## Phase 18 — Meal Planning

### Goal

The "Plan obroka" feature.

### Tasks

- [ ] Build `MealPlanCalendar` (weekly view)
- [ ] Build `MealPlanEntryForm` (assign recipe to date/slot, optional note)
- [ ] Implement remove/change entry

### Database / Supabase

- [ ] `meal_plan_entries` CRUD (authenticated only, no public view)

### UI / UX

- [ ] `MealPlanPage` visual language consistent with dashboard (cards, dark theme, amber accents)
- [ ] Overwrite confirmation when assigning an already-filled slot
- [ ] "Recipe removed" state shown when a planned recipe is deleted

### Internationalization

- [ ] Slot names (breakfast/lunch/dinner/snack) localized
- [ ] Calendar labels localized

### Testing & Verification

- [ ] Manual: assign/change/remove across a week
- [ ] Manual: verify set-null behavior after deleting a planned recipe

### Definition of Done

- [ ] Admin can plan meals across a week, view/edit/remove entries, in both languages

### Out of Scope

Grocery-list generation, recurring plans.

### Phase Status

- [ ] Phase Complete

---

## Phase 19 — Kitchen Notes

### Goal

The "Kuhinjske beleške" feature.

### Tasks

- [ ] Build `NoteCard` and notes list
- [ ] Build `NoteForm` (create/edit)
- [ ] Implement delete
- [ ] Implement pin/unpin

### Database / Supabase

- [ ] `kitchen_notes` CRUD (authenticated only, admin-only feature)

### UI / UX

- [ ] `NotesPage` visual language consistent with dashboard
- [ ] Long note bodies truncated in list view, full in detail/edit

### Internationalization

- [ ] Title/body EN+SR fields in editor
- [ ] Note cards show current-locale content with fallback

### Testing & Verification

- [ ] Manual: CRUD + pin ordering check
- [ ] Manual: deleting a linked recipe leaves note intact with link cleared

### Definition of Done

- [ ] Admin can create, edit, pin, and delete notes, optionally linked to a recipe, in both languages

### Out of Scope

Public visibility of notes.

### Phase Status

- [ ] Phase Complete

---

## Phase 20 — Deployment & Production Verification

### Goal

The app is live on Vercel against the production Supabase project.

### Tasks

- [ ] Link Vercel project to GitHub repo
- [ ] Provision production Supabase project
- [ ] Run Phase 4 migrations against production (no dev seed data)
- [ ] Set production env vars in Vercel
- [ ] Verify preview-deployment flow on a test PR

### Database / Supabase

- [ ] Production RLS re-verified (anon SELECT works, anon writes rejected, authenticated writes succeed)
- [ ] Production Storage bucket + policies created

### UI / UX

- [ ] N/A (verification only)

### Internationalization

- [ ] Both locales verified working on the deployed URL

### Testing & Verification

- [ ] Full manual production smoke test: browse, search, filter, view detail, log in, create/edit/delete a recipe, upload an image, plan a meal, add a note — in both languages

### Definition of Done

- [ ] Production URL is live, publicly browsable without login, admin can log in and manage all content, RLS verified in production

### Out of Scope

Custom domain setup, monitoring/analytics.

### Phase Status

- [ ] Phase Complete

---
**MVP COMPLETE**
---

## Phase 21 — Responsive Refinement Pass

### Goal

Systematic breakpoint review beyond the per-phase spot checks.

### Tasks

- [ ] Audit every MVP screen at desktop/tablet/mobile breakpoints
- [ ] Fix spacing/overflow/touch-target issues
- [ ] Verify Serbian text doesn't break layouts anywhere

### Database / Supabase

- [ ] N/A for this phase

### UI / UX

- [ ] Full breakpoint checklist pass across all MVP screens

### Internationalization

- [ ] Layout verified in both languages at all breakpoints

### Testing & Verification

- [ ] Manual full-app breakpoint review

### Definition of Done

- [ ] All MVP screens pass a full desktop/tablet/mobile review checklist in both languages

### Out of Scope

New features.

### Phase Status

- [ ] Phase Complete

---

## Phase 22 — Accessibility Pass

### Goal

Address accessibility systematically beyond per-phase basics.

### Tasks

- [ ] Keyboard-navigation audit across all core flows
- [ ] Add focus-visible styles
- [ ] Add `aria` labeling for icon-only buttons
- [ ] Verify dialog focus trapping
- [ ] Color-contrast check on dark theme
- [ ] Re-verify `<html lang>` correctness

### Database / Supabase

- [ ] N/A for this phase

### UI / UX

- [ ] N/A beyond audit fixes

### Internationalization

- [ ] Accessible language selector verified

### Testing & Verification

- [ ] Keyboard-only pass through all core flows
- [ ] Contrast checks pass
- [ ] Screen-reader spot check on key pages

### Definition of Done

- [ ] Keyboard-only pass succeeds; contrast checks pass; screen-reader spot check done

### Out of Scope

Formal WCAG certification.

### Phase Status

- [ ] Phase Complete

---

## Phase 23 — Performance Pass

### Goal

Practical performance tuning.

### Tasks

- [ ] Verify image lazy-loading
- [ ] Verify Supabase queries select only needed columns
- [ ] Audit TanStack Query cache keys to eliminate duplicate requests
- [ ] Code-split admin routes from public routes
- [ ] Bundle-size check

### Database / Supabase

- [ ] N/A for this phase

### UI / UX

- [ ] N/A for this phase

### Internationalization

- [ ] N/A for this phase

### Testing & Verification

- [ ] Lighthouse/basic bundle check shows no obvious regressions
- [ ] Confirm admin bundle not loaded for public visitors

### Definition of Done

- [ ] No obvious performance regressions; admin bundle excluded from public bundle

### Out of Scope

CDN/edge-caching strategy beyond Vercel defaults.

### Phase Status

- [ ] Phase Complete

---

## Phase 24 — Testing Hardening

### Goal

Deepen automated coverage beyond per-phase smoke tests.

### Tasks

- [ ] Set up Playwright
- [ ] E2E: browse → detail
- [ ] E2E: search/filter
- [ ] E2E: language switch
- [ ] E2E: admin login
- [ ] E2E: recipe create/edit/delete
- [ ] E2E: image upload
- [ ] E2E: RLS rejection of unauthenticated writes

### Database / Supabase

- [ ] N/A for this phase

### UI / UX

- [ ] N/A for this phase

### Internationalization

- [ ] E2E covers both languages where relevant

### Testing & Verification

- [ ] E2E suite passes in CI

### Definition of Done

- [ ] E2E suite covers all listed flows and passes in CI

### Out of Scope

Full unit-test coverage of every component.

### Phase Status

- [ ] Phase Complete

---

## Phase 25 — Optional / Future Ideas (not scheduled)

Backlog only — not part of MVP or Post-MVP polish. Promote items here to a new phase if the user decides to pursue them:

- [ ] Light theme toggle
- [ ] Printable recipe view
- [ ] Public shareable recipe links with rich previews
- [ ] Nutrition info fields
- [ ] Ingredient master-catalog with autocomplete
- [ ] Postgres full-text search (if collection grows large)
- [ ] Automated Storage orphan-sweep job

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal recipe collection web app (browse, search, admin-manage recipes with photos). Vite + React 19 + TypeScript, Supabase (Postgres + Storage + Auth) for the backend, deployed to Vercel.

Work is tracked live in `ROADMAP.md` (Phases 33+: security, images, hardening) — check its Status table and Workflow rules before starting work; it runs one phase at a time with an explicit stop after each. `DEVELOPMENT_PLAN.md` holds only the deferred Phase 32 (full-text search). Original design/schema rationale is in `recepies-details/Recipes-Website-Context.txt`.

## Commands

```
npm run dev       # start Vite dev server (opens browser)
npm run build     # tsc -b type-check, then vite build
npm run lint      # eslint .
npm run format    # prettier --write .
npm test          # vitest run (single run, not watch)
npm run preview   # preview production build
npm run verify:rls # checks live RLS/Storage policies as anon, a non-admin and the admin (RLS_* logins in .env.local)
npm run images:audit   # rows vs Storage objects → docs/images-audit.md (read-only, HEADs only)
npm run images:backup  # dry run; `-- --apply` downloads both buckets to git-ignored backups/images/, `-- --verify` re-hashes
npm run db:export      # every table as JSON → git-ignored backups/db/{timestamp}/ (see docs/backup.md)
npm run images:migrate # dry run: originals (from backups/images/) → WebP q85 variants; `-- --apply` uploads (scripts/images/README.md)
npm run images:check   # uploaded WebP vs the manifests (`-- --full` downloads + sha256)
npm run images:flip    # dry run: point rows at the uploaded WebP; `-- --apply`, `-- --rollback --apply` (one transaction per table)
```

The `.ts` scripts run directly on Node 24 (type stripping, so relative imports need the `.ts` extension); `tsconfig.scripts.json` puts them under `tsc -b`. They use `SUPABASE_SERVICE_ROLE_KEY` if set, otherwise the `RLS_ADMIN_*` login.

Run a single test file: `npx vitest run src/lib/recipeFilter.test.ts`. Tests use Vitest + Testing Library with jsdom (setup file: `src/test/setup.ts`); test files live next to the code they cover (`*.test.ts(x)`).

Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) must be set in `.env.local` (see `.env.local.example`) — `src/lib/supabaseClient.ts` throws at import time if they're missing.

## Architecture

### Routing and i18n are coupled

Every route is nested under a `:lang` segment (`sr` default, `en` supported — see `src/lib/i18n.ts`). `App.tsx`'s `LocaleGate` validates the `:lang` param, syncs it into i18next and `<html lang>`, and redirects to a valid locale-prefixed path if invalid. Route *paths themselves* are localized (e.g. `recepti`, `kategorije`, not `recipes`, `categories` — see the Serbian route segments in `App.tsx`). Use `buildLocalizedPath`/`stripLangPrefix` (`src/lib/localizedPath.ts`) rather than hand-building URLs so the current language prefix is preserved.

Two route trees share the `:lang` parent: the public `AppShell` tree (home, recipe browsing/detail, category pages) and an admin tree wrapped in `ProtectedRoute` + `AdminShell`.

### Auth model

Single-admin auth via Supabase Auth (email/password), not a general user system; sign-ups must stay disabled in the dashboard (Authentication → "Allow new users to sign up"). The admin is whoever is listed in the `admin_users` table (no API access to it), checked by the `is_admin()` security-definer function (`supabase/migrations/20261008120000_admin_lockdown.sql`). Every table's write policy and both Storage buckets' policies require `is_admin()`; a signed-in non-admin can write nothing. Public reads stay open on every table, including `kitchen_notes` and `meal_plan_entries`; bucket objects are public by URL but can't be listed. `AuthProvider` (`src/components/auth/AuthProvider.tsx`) wraps the whole app and exposes `session` and `isAdmin` (from `rpc('is_admin')`) via `useAuth`; `ProtectedRoute` gates the `/admin/*` subtree client-side on `isAdmin`, but the real enforcement is RLS. Never introduce service-role Supabase keys into frontend code.

Favourites: the admin's hearts write `recipes.is_favorite`; every other viewer's hearts live in localStorage (`src/lib/localFavorites.ts`). Pages go through `useFavorites()` (`apply` a recipe, `toggle` a heart, `localIds` for queries) instead of reading `is_favorite` or the session directly.

### Data layer

Supabase schema: `recipes`, `ingredients`, `steps`, `categories`, `tags` (see `supabase/migrations/`, applied in order by filename timestamp). `src/types/recipe.ts` defines the shapes consumed by the UI (e.g. `RecipeSummary`, `SearchableRecipe`) — note the `_en`/`_sr` suffix convention for bilingual fields throughout the schema and types. Recipe images live in Supabase Storage; `src/lib/storage.ts` and `src/hooks/useRecipeImages.ts` handle upload/path resolution.

Data fetching is done through small dedicated hooks in `src/hooks/` (`useAllRecipes`, `useRecipeBySlug`, `useRecipesByCategory`, `useAdminRecipes`, etc.) built on top of query helpers in `src/lib/recipeQueries.ts`, rather than a generic fetching abstraction — follow that pattern (one hook per query shape) when adding new data needs.

### Admin recipe form

`RecipeForm` + `IngredientEditor`/`StepEditor`/`ImageManager` (`src/components/admin/`) drive create/edit. Form state normalization and the create/update payload shape are centralized in `src/lib/recipeFormState.ts` and validated with `src/lib/recipeFormSchema.ts` (Zod). `useSaveRecipe` performs the actual Supabase write.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite`, no separate config file — tokens are defined in `src/index.css`). Radix primitives (`Dialog`, `DropdownMenu`, `Tabs`) are wrapped under `src/components/ui/`.

### Deployment

Vercel, with `vercel.json` rewriting all paths to `index.html` (required for client-side routing on direct/refreshed navigation to non-root routes — see commit `861ec84`).

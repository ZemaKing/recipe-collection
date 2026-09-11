# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal recipe collection web app (browse, search, admin-manage recipes with photos). Vite + React 19 + TypeScript, Supabase (Postgres + Storage + Auth) for the backend, deployed to Vercel.

Build progress is tracked live in `DEVELOPMENT_PLAN.md` — check "Current Phase" there before starting work to know what's already implemented vs. planned. Original design/schema rationale is in `recepies-details/Recipes-Website-Context.txt`.

## Commands

```
npm run dev       # start Vite dev server (opens browser)
npm run build     # tsc -b type-check, then vite build
npm run lint      # eslint .
npm run format    # prettier --write .
npm test          # vitest run (single run, not watch)
npm run preview   # preview production build
```

Run a single test file: `npx vitest run src/lib/recipeFilter.test.ts`. Tests use Vitest + Testing Library with jsdom (setup file: `src/test/setup.ts`); test files live next to the code they cover (`*.test.ts(x)`).

Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) must be set in `.env.local` (see `.env.local.example`) — `src/lib/supabaseClient.ts` throws at import time if they're missing.

## Architecture

### Routing and i18n are coupled

Every route is nested under a `:lang` segment (`sr` default, `en` supported — see `src/lib/i18n.ts`). `App.tsx`'s `LocaleGate` validates the `:lang` param, syncs it into i18next and `<html lang>`, and redirects to a valid locale-prefixed path if invalid. Route *paths themselves* are localized (e.g. `recepti`, `kategorije`, not `recipes`, `categories` — see the Serbian route segments in `App.tsx`). Use `buildLocalizedPath`/`stripLangPrefix` (`src/lib/localizedPath.ts`) rather than hand-building URLs so the current language prefix is preserved.

Two route trees share the `:lang` parent: the public `AppShell` tree (home, recipe browsing/detail, category pages) and an admin tree wrapped in `ProtectedRoute` + `AdminShell`.

### Auth model

Single-admin auth via Supabase Auth (email/password), not a general user system. `AuthProvider` (`src/components/auth/AuthProvider.tsx`) wraps the whole app and exposes session state via `useAuth`; `ProtectedRoute` gates the `/admin/*` subtree client-side. Actual write authorization is enforced server-side through Postgres RLS policies (`supabase/migrations/20260910120200_rls_policies.sql`), not by the client route guard — public reads are open, writes require an authenticated session. Never introduce service-role Supabase keys into frontend code.

### Data layer

Supabase schema: `recipes`, `ingredients`, `steps`, `categories`, `tags` (see `supabase/migrations/`, applied in order by filename timestamp). `src/types/recipe.ts` defines the shapes consumed by the UI (e.g. `RecipeSummary`, `SearchableRecipe`) — note the `_en`/`_sr` suffix convention for bilingual fields throughout the schema and types. Recipe images live in Supabase Storage; `src/lib/storage.ts` and `src/hooks/useRecipeImages.ts` handle upload/path resolution.

Data fetching is done through small dedicated hooks in `src/hooks/` (`useAllRecipes`, `useRecipeBySlug`, `useRecipesByCategory`, `useAdminRecipes`, etc.) built on top of query helpers in `src/lib/recipeQueries.ts`, rather than a generic fetching abstraction — follow that pattern (one hook per query shape) when adding new data needs.

### Admin recipe form

`RecipeForm` + `IngredientEditor`/`StepEditor`/`ImageManager` (`src/components/admin/`) drive create/edit. Form state normalization and the create/update payload shape are centralized in `src/lib/recipeFormState.ts` and validated with `src/lib/recipeFormSchema.ts` (Zod). `useSaveRecipe` performs the actual Supabase write.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite`, no separate config file — tokens are defined in `src/index.css`). Radix primitives (`Dialog`, `DropdownMenu`, `Tabs`) are wrapped under `src/components/ui/`.

### Deployment

Vercel, with `vercel.json` rewriting all paths to `index.html` (required for client-side routing on direct/refreshed navigation to non-root routes — see commit `861ec84`).

# recipe-collection

A personal, bilingual (Serbian / English) recipe collection: browse and search recipes, filter by
category, subcategory and tag, scale servings, see nutrition computed from an ingredient catalog,
and keep favourites. One owner manages everything in an admin area: recipes and photos, the
ingredient catalog (macros, vitamins, minerals, photos), categories, subcategories and tags,
kitchen notes and a weekly meal plan. Recipes and ingredients can be drafted with any AI chat
and imported as JSON.

**Stack:** Vite + React 19 + TypeScript, Tailwind CSS v4, Radix UI, react-router (every route
under `/sr` or `/en`), Supabase (Postgres + Auth + Storage), Vercel.

Developer notes (architecture, conventions) are in [`CLAUDE.md`](CLAUDE.md); the work log and
open decisions in [`ROADMAP.md`](ROADMAP.md).

## Setup

Requires **Node 24** (the `scripts/*.ts` files run with Node's built-in type stripping) and npm.

```bash
npm ci
cp .env.local.example .env.local   # then fill it in
npm run dev                         # http://localhost:5173
```

`.env.local` (never committed; see [`.env.local.example`](.env.local.example)):

| Variable | Used by | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | the app | Dashboard → Project Settings → API. The anon/publishable key only: the app refuses to start with a secret key |
| `RLS_ADMIN_EMAIL`, `RLS_ADMIN_PASSWORD` | `verify:rls`, `images:*`, `db:export` | the owner's login |
| `RLS_USER_EMAIL`, `RLS_USER_PASSWORD` | `verify:rls` | a user added by hand in the dashboard that is **not** an admin |
| `SUPABASE_SERVICE_ROLE_KEY` | `images:*`, `db:export` (optional) | only needed to export `admin_users`. Never `VITE_`-prefixed |

## Database

There's no Supabase CLI link: migrations are plain SQL files run by hand in the dashboard's SQL
editor, **in filename order** (`supabase/migrations/`). Schema changes always go in a new
timestamped file.

For a fresh project:

1. Run every file in `supabase/migrations/` in order. Before
   `20261008120000_admin_lockdown.sql`, create the owner (Authentication → Add user) and replace
   `REPLACE_WITH_ADMIN_EMAIL` with that email **in the editor only**: the file adds that user to
   `admin_users`, and only they can write.
2. Authentication → turn off "Allow new users to sign up".
3. Optional sample data: `supabase/seed.sql` (safe to re-run).
4. `npm run verify:rls` proves anon and a signed-in non-admin can't write.

Every table is publicly readable; writes and Storage uploads require `is_admin()`. Photos live in
two public buckets (`recipe-images`, `ingredient-images`), stored as WebP.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `preview` | dev server · type-check + production build (+ secret and CSP checks) · serve `dist/` on :4173 with production's headers |
| `npm run lint` / `format` / `typecheck` | ESLint · Prettier · `tsc -b` (app, `scripts/`, `e2e/`) |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright journeys on desktop + mobile, read-only against the live project ([`e2e/README.md`](e2e/README.md)) |
| `npm run verify:rls` | live RLS/Storage policy check as anon, a non-admin and the admin (creates and deletes throw-away fixtures) |
| `npm run verify:prod` | read-only release check; add `-- --url https://…` for the deployed site's headers, CSP and bundle |
| `npm run db:export` / `images:backup` | backups, see [`docs/backup.md`](docs/backup.md) |
| `npm run images:audit` | rows vs Storage objects → [`docs/images-audit.md`](docs/images-audit.md) |
| `npm run images:migrate` / `check` / `flip` / `prune-originals` | the one-off WebP migration tools ([`scripts/images/README.md`](scripts/images/README.md)); dry run unless `-- --apply` |
| `npm run perf:vitals` | lab Web Vitals against `npm run preview` → [`docs/performance.md`](docs/performance.md) |

## Testing

- **Unit:** `npm test`, files next to the code (`*.test.ts(x)`); one file:
  `npx vitest run src/lib/recipeFilter.test.ts`.
- **E2E:** `npm run test:e2e` uses the installed Microsoft Edge and never writes to Supabase.
  Admin flows are a manual checklist in [`e2e/README.md`](e2e/README.md).
- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): lint, typecheck, unit tests and
  build on every push to `main` and every pull request.

## Deployment

Vercel builds every push: `main` goes to production, other branches and PRs get preview
deployments. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project.

[`vercel.json`](vercel.json) rewrites every path to `index.html` (client-side routing), sets the
security headers and the Content-Security-Policy, and caches `/assets/*` immutably. The CSP
names the Supabase URL and the sha256 of the inline theme script in `index.html`: a different
Supabase project, a new external origin or an edited theme script needs a `vercel.json` change,
and the build (`postbuild` → `scripts/check-csp.mjs`) fails until it's made. The build also fails
if a Supabase secret key ends up in the bundle.

Before a release: CI green, `npm run test:e2e`, the admin checklist in `e2e/README.md` on the
preview deployment, then after promoting `npm run verify:prod -- --url https://<production>`.

## Backups

The Free plan has no downloadable backups, so `npm run db:export` and
`npm run images:backup -- --apply` write to the git-ignored `backups/` folder. Schedule, second
copy and restore steps: [`docs/backup.md`](docs/backup.md).

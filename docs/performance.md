# Performance (ROADMAP Phase 40)

Measured 2026-10-08 with `npm run perf:vitals` (`scripts/perf/vitals.mjs`, ported from the diecast app). Setup: production build on `vite preview`, headless Edge, cold cache, medians of 5 runs, the real Supabase project.
- **mobile**: 412×823 @1.75x, 4× CPU slowdown, 150 ms RTT / 1.6 Mbps ("Slow 4G").
- **desktop**: 1350×940, no CPU slowdown, 40 ms / 10 Mbps.

```
npm run build && npm run preview            # another terminal, serves dist/ on :4173
npm run perf:vitals                         # all routes, both profiles, 5 runs each
npm run perf:vitals -- --runs 1 --profile mobile --route /sr --waterfall
```

DevTools applies the throttling, so compare these numbers with each other, not with PageSpeed Insights. It also splits bandwidth evenly between parallel requests, so it can't show what `fetchpriority` does (tried on the first row of cards: no change, so it was dropped). Supabase over the internet adds ±150 ms of noise to anything that waits on data, and CLS occasionally reads ~0.03 on one run of five.

## Budget

| Metric | Budget | Mobile | Desktop |
| --- | --- | --- | --- |
| LCP | ≤ 2.5 s | ❌ **2.9–4.3 s**, accepted (gap below) | ✅ ≤ 2.1 s |
| FCP | ≤ 1.8 s | ✅ ≤ 1.69 s | ✅ ≤ 0.34 s |
| CLS | ≤ 0.1 | ✅ ≤ 0.010 | ✅ ≤ 0.03 |
| TBT (lab stand-in for INP) | ≤ 200 ms | ✅ ≤ 35 ms | ✅ 0 |
| Initial JS (gzip) | ≤ 220 kB | ✅ 214 kB | ✅ |
| Card photos before the first scroll | on-screen cards only | ✅ | ✅ |

## Before / after

| Profile | Route | FCP | LCP | CLS | TBT | Requests | Transfer kB | Images kB × n | REST GETs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mobile | `/sr` | 1824 → 1688 | 5572 → **4344** | 0.000 → 0.001 | 0 → 0 | 32 → 30 | 1209 → 890 | 818 ×9 → 603 ×8 | 7 → 7 |
| mobile | `/sr/recepti` | 1844 → 1676 | 6892 → **3704** | 0.002 → 0.002 | 36 → 18 | 32 → 22 | 1603 → 702 | 1192 ×13 → 395 ×6 | 5 → 4 |
| mobile | `/sr/recepti/spagete-sa-sampinjonima` | 1788 → 1656 | 3544 → **2864** | 0.010 → 0.010 | 25 → 35 | 19 → 19 | 533 → 408 | 140 ×2 → 118 ×3 | 4 → 4 |
| mobile | `/sr/kategorije/glavna-jela` | 1792 → 1652 | 9152 → **4216** | 0.001 → 0.001 | 0 → 0 | 34 → 24 | 1964 → 732 | 1567 ×15 → 438 ×6 | 5 → 5 |
| desktop | `/sr` | 364 → 340 | 1216 → **1164** | 0.029 → 0.000 | 0 | 32 → 32 | 1209 → 1117 | 818 ×9 → 829 ×10 | 7 → 7 |
| desktop | `/sr/recepti` | 356 → 332 | 3216 → **1856** | 0.028 → 0.000 | 0 | 55 → 33 | 4010 → 1800 | 3599 ×36 → 1493 ×17 | 5 → 4 |
| desktop | `/sr/recepti/spagete-sa-sampinjonima` | 360 → 332 | 888 → **808** | 0.001 → 0.000¹ | 0 | 19 → 19 | 533 → 408 | 140 ×2 → 118 ×3 | 4 → 4 |
| desktop | `/sr/kategorije/glavna-jela` | 364 → 332 | 2184 → **2052** | 0.000 → 0.000 | 0 | 36 → 35 | 2185 → 2008 | 1788 ×17 → 1714 ×17 | 5 → 5 |

Times in ms. "Images" counts photos, the favicon and the mom icon. ¹ 0.028 in the 5-run pass, 0.000 over 7 runs right after (noise).

**JS (gzip)**: 245 kB → 214 kB, in three chunks. `index` (122 → 108: app + react-dom + lucide + Radix menu), `Combination` (67, unchanged: shared vendor code, i.e. i18next 42 kB + react-i18next 40 + react-router 38 + tailwind-merge 26 kB minified, not locales), and `localizedField` (55 → 38: **supabase-js**; Rolldown names a chunk after its first small module). Admin-only code was already split: `CategorySelect` (react-select + emotion, 29 kB) and `clipboard` (zod, 25 kB) load on admin routes only.

**Fonts**: two Google Fonts files (130 kB) + a render-blocking cross-origin stylesheet → 47 kB, self-hosted.

## What changed

1. **Card photos load when on screen** (`useNearViewport`, used by `RecipeImage`). Native `loading="lazy"` fetches everything within 1250–2500 px, so a phone pulled 13–15 card photos (≈ 100 kB each) at once and the visible ones shared the bandwidth. Before the first scroll, only cards that are actually on screen load. After it, cards load 600 px ahead of `<main>`'s visible area (`<main>` is the scroll container, so it is the observer's root). Only the first 2 cards (a phone's first row) are `eager`. Before, it was the widest layout's first row (4–5), which on a phone included an off-screen card.
2. **Self-hosted Inter** (`src/assets/fonts/`, `@font-face` in `src/index.css`). Google's own v20 variable files (weight 100–900): `latin` unchanged (47 kB), and `latin-ext` (83 kB) cut down with fonttools `pyftsubset` to the 10 Serbian letters the app uses: Ć ć Č č Đ đ Š š Ž ž, 3.6 kB, inlined into the CSS by Vite. A scan of both locale files and every table's text found nothing else beyond Latin-1 except punctuation already in `latin` and a few stray Cyrillic letters, which fall back to the system font. Inter is SIL OFL (`src/assets/fonts/OFL.txt`). Re-subset if the app ever needs more letters (e.g. a new language).
3. **Realtime stub** (`src/lib/realtime-stub.ts`, aliased in `vite.config.ts`, from diecast): the app never opens a channel, so realtime-js + Phoenix (~55 kB min, 17 kB gzip) are gone. `realtime-stub.test.ts` fails if a supabase-js upgrade calls anything the stub lacks.
4. **Mom icon as a file**: the "Mamin recept" illustration was 28 kB of inline SVG path data in the main bundle (11 kB gzip). It is now `src/assets/mom-icon.svg`, loaded as a cached `<img>`.
5. **Detail hero `srcset`** (`getRecipeImageSrcSet`): the 750 px `card` variant is offered next to the full image, with `sizes` matching the hero (380 px from `lg`, full width below). Phones at ≤ 2× and the desktop column take the card; tablets still get the full image.
6. **Supabase `preconnect`** in `index.html` (both pools: CORS for the API, plain for `<img>`). `%VITE_SUPABASE_URL%` is filled in at build time.
7. **Shared lookups** (`src/lib/sharedQuery.ts` + `useSharedQuery`): categories, subcategories, tags and the full recipe list. Consumers that mount together share one request: on `/recepti` the sidebar and the page fetched `categories` twice. A later mount shows the cached list at once and revalidates in the background, so going back to `/recepti` or recently added no longer flashes skeletons. It replaces `useTags`' hand-rolled cache and its invalidation calls.
8. **Primary image only** (`withPrimaryImageOnly`): list queries embed `images.order=is_primary.desc,order_index.asc&images.limit=1` instead of every photo of a recipe. One recipe already has 2 photos; galleries are on the backlog.

## Decisions (from measurements)

- **No TanStack Query.** Every REST call is 1–17 kB and they run in parallel, about 0.25–0.5 s on mobile, and never on the LCP's critical path more than once. The duplicates were concurrent mounts, which the 40-line shared query removes. Parameterised lists (home's recent 8, favourites, a category) still fetch on each mount; they are small.
- **Home stats stay 4 `HEAD` counts** (+ 4 preflights). They run in parallel with the recipe query and carry no bytes. One RPC would need a migration for no visible gain.
- **No lazy locale.** The inactive locale is ~6 kB gzip (≈ 30 ms on Slow 4G). Loading it on demand would cost an extra round trip for every `/en` first visit.
- **No route-level splitting of public pages.** As in diecast, it would add a round trip to every shared link for a few kB.
- **`/recepti` payload**: 62 recipes = 77 kB raw / 17 kB on the wire (ingredient names make it searchable client-side). Card columns are all used (rating/created_at by the sort, subcategory on the card).
- **Phase 32 (Postgres full-text search) stays deferred.** Trigger: **recipes > ~1,000, or the `/recepti` recipes GET > ~500 kB gzip**, whichever comes first. At ~0.27 kB gzip per recipe, the recipe count trips first.

## The remaining mobile LCP gap

On Slow 4G, LCP is roughly "every byte fetched before the LCP photo ÷ 200 kB/s": JS 214 kB + CSS 14 kB + Inter 47 kB + the on-screen card photos (4–6 × ~70–117 kB, all started together after the data arrives at ~2.1 s). Desktop meets the budget everywhere. **The owner accepted it (2026-10-08, ROADMAP Open decision 7 → b).** The options considered:

- **(a) A phone card variant** (`cover 340`, 510×340, q85) in a `srcset` on cards. Measured locally with sharp on the 62 backed-up originals: **avg 53 kB vs 96 kB** for today's `card`. That is enough for 166 CSS px cards up to 2× DPR, while 3× phones would still take the 750 px card. Estimated mobile LCP ≈ 2.8–3.4 s. Cost: 62 new objects (~3.3 MB Storage), a `thumb_path`-like column or path convention, the upload path and a migration job.
- **(b) Accept it**, as the diecast app did (~2.9 s there). It is the cost of a client-rendered app reading a remote DB with sharp 2–3× card photos. On regular 4G (≈ 9 Mbps) the same bytes take about a fifth of the time.
- Not worth it: preloading the font (it competes with the JS; diecast measured FCP +140 ms), lazy-loading the second locale (see above).

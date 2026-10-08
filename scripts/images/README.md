# Image pipeline (WebP → Supabase Storage)

A config-driven batch converter: a list of source images (local files or URLs) → resized WebP variants → a Supabase Storage bucket, with **retries**, **resume**, **checksums** and a **dry run**. Nothing in this folder knows about recipes; the recipe and ingredient jobs live in [`../migrate-images/`](../migrate-images/).

Copied from `../diecast-collection/scripts/images/` (diecast ROADMAP Phase 21) in recipes ROADMAP Phase 35, reformatted with this repo's Prettier config. See **Differences from the diecast copy** below — the game app's copy should take the same changes.

Why generate WebP ourselves: Supabase's on-the-fly image transformations are a paid feature, and the free plan's egress (~5 GB/month) doesn't go far with ~180 KB PNG thumbnails. A ~400 px WebP thumbnail is ~25 KB.

## Files

| File | What it does |
| --- | --- |
| `types.ts` | `ImageJob`, `Variant`, `ImageSource`, `StorageTarget` |
| `cli.ts` | The command line: `upload` (dry run by default, `--apply` to upload) and `verify` |
| `batch.ts` | `runBatch()`: read each original once (local file or download) → every variant → upload → manifest. Concurrency pool, per-source failures don't stop the batch |
| `convert.ts` | `sharp`: fit inside `maxWidth × maxHeight`, never enlarge, EXIF-rotate, strip metadata, WebP; sha256 |
| `manifest.ts` | The JSON manifest: one entry per uploaded object (source URL + sha256, settings, output sha256/bytes/dimensions) |
| `retry.ts` | `withRetry()`: exponential backoff + jitter; retries network errors, timeouts, 408/425/429/5xx — not other 4xx |
| `verify.ts` | Compares what Storage serves with the manifest (`head`: status/type/size; `full`: sha256 + dimensions) |
| `supabase-target.ts` | Supabase Storage as the upload target; service-role client with a key-role check |
| `paths.ts` | Storage keys from a pattern, rejecting unsafe segments |

The browser counterpart for upload forms is [`src/lib/image-resize.ts`](../../src/lib/image-resize.ts) (canvas → WebP, same fit rules, no imports — copy it as-is).

## Differences from the diecast copy

1. **Local sources.** `ImageSource.file` (+ optional `sha256`): the original is read from disk instead of downloading `url`, and a copy whose sha256 doesn't match fails that source. `url` stays the source's identity in the manifest. Here the jobs point at the Phase 34 backup (`backups/images/`), so a migration costs no download egress. The summary reports `downloadedBytes` separately.
2. **Per-variant paths.** `Variant.pathPattern` overrides the job's pattern, so the full image can be `{folder}/{name}.webp` and the thumb `{folder}/{name}.thumb.webp`.
3. **Several jobs per run.** `cli.ts a.ts b.ts upload …` runs the jobs one after the other (`--limit` per job, `--only` across them) and prints a combined before/after.
4. **Connection.** `cli.ts` uses `scripts/lib/supabase-script.ts` `connect()`: the service-role key if set, else the admin login (`RLS_ADMIN_*`), whose `is_admin()` policies can write both buckets. It reads `.env.local` itself, so it runs on plain `node` (Node 24 type stripping) — no `tsx`. `checkBucket()` falls back to a listing when bucket settings can't be read (admin login).
5. **`Variant.fit: 'outside'`** bounds the short edge instead of the long one (for thumbs the UI crops to a square). `variantSettings()` only mentions it when set, so older manifest entries stay valid.
6. **Per-variant resume.** A source with some variants done converts and uploads only the missing ones, so adding a variant to a job doesn't re-upload the rest.
7. Every variant here uses **WebP quality 85** (owner's choice, 2026-10-08).

## Running the recipe migration

```bash
npm run images:migrate                         # dry run, both jobs: reads + converts, prints sizes, uploads nothing
npm run images:migrate -- --limit=5 --apply    # first 5 of each job
npm run images:migrate -- --apply              # the rest; re-run after any failure — done sources are skipped
npm run images:check -- --full                 # every object: HTTP 200, sha256 and dimensions match the manifest
```

Flags: `--dry-run` (the default), `--apply`, `--force` (redo even if done), `--only=key1,key2` (keys are the originals' storage paths), `--limit=N`. Manifests: `../migrate-images/recipe-manifest.json` and `ingredient-manifest.json` (written on `--apply`; commit them, they're the record). Pointing rows at the new paths is Phase 36 (`images:flip`).

## Behaviour worth knowing

- **Resume:** the manifest is rewritten after every source. A source is skipped when every variant is in the manifest with the same source URL and the same settings, *and* (on `--apply`) Storage still has each object at the recorded size. Change a variant's size/quality and the next run redoes everything.
- **Integrity:** each upload is followed by a `stat` that must report the uploaded byte count. `verify --full` downloads every object and checks sha256 + dimensions.
- **Failures:** a 404 or a non-image is final for that source (reported, not retried); everything else is retried up to `retries` times. The batch always finishes and exits 1 if anything failed.
- **Caching:** objects get `Cache-Control: max-age=604800` (a week) by default (`cacheControl`); the recipe jobs use a year (`31536000`), because a new photo always gets a new path. So never re-upload *different* bytes to a path that's already live (e.g. `--force` with new settings after the flip) — browsers would keep the old file.
- Extract into a shared package only if the copies in the three apps start diverging.

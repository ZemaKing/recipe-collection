# Backups

The Free plan has no downloadable automatic backups, so these exports are the backup. Everything lands in `backups/` (git-ignored): it holds every photo (the pre-WebP originals from Phase 34 plus the WebP files from every later run) and the full database, including kitchen notes and meal plans. Keep it on your machine and **one second place** (an external drive or your own private cloud folder). Never commit it.

| Command | Writes | Network |
| --- | --- | --- |
| `npm run images:audit` | `docs/images-audit.md` (committed): rows vs objects, bytes by format, orphans, duplicates | listings + one `HEAD` per object, no image bodies |
| `npm run images:backup` | nothing; prints what would be downloaded and how many bytes | listings only |
| `npm run images:backup -- --apply` | `backups/images/{bucket}/{path}` + `backups/images/manifest.json` (bytes, sha256, ETag, type, width × height per file) | downloads only what's new or changed; counts against the org's shared 5 GB/month egress |
| `npm run images:backup -- --verify` | nothing; re-hashes every local file against the manifest | none |
| `npm run images:backup -- --restore` | nothing; lists files rows point at that are missing from Storage | listings + a read of the image rows |
| `npm run images:backup -- --restore --apply` | **Storage**: re-uploads exactly those files from `backups/images/` (sha256-checked, `upsert: false`, never overwrites) | uploads only |
| `npm run db:export` | `backups/db/{timestamp}/{table}.json` + `manifest.json` (row counts, sha256 per file) | a few hundred KB |

**Credentials** (`.env.local`, never `VITE_`-prefixed): `SUPABASE_SERVICE_ROLE_KEY` if present, otherwise the owner's login `RLS_ADMIN_EMAIL` / `RLS_ADMIN_PASSWORD`. The admin login is enough for everything except `admin_users`, which only the service role can read; without the key `db:export` skips it and says so in its manifest. That table holds one row: the owner's `auth.users` id.

The image backup is resumable: the manifest is saved after every file, files are written via `.part` + rename, and each download is checked against the listed size and (for single-part uploads) the MD5 ETag. A re-run downloads only objects that are new, missing locally, changed size or ETag, or fail their checksum. A local copy is never deleted, even after its object leaves the bucket.

**Not covered:** Supabase Auth users (recreate the owner in the dashboard and put the new id in `admin_users`) and project settings (sign-ups off, bucket limits: see the Phase 33 migration).

## Schedule

| When | Run |
| --- | --- |
| After a batch of admin edits, and **at least monthly** (first of the month) | `npm run db:export` |
| After adding or replacing photos, and at least monthly | `npm run images:backup` (dry run: prints the bytes), then `-- --apply`. Today's buckets are ≈ 17 MB in total, so a full first run is cheap; later runs fetch only new files |
| Monthly, after the two above | `npm run images:backup -- --verify`, then copy `backups/` to the second place |
| Before any bulk or destructive step (a migration that rewrites rows, a bucket change, an `images:*` `--apply`) | all three of the above |

Old `backups/db/` folders can be kept; each one is ~2 MB. Nothing runs automatically: the scripts need the owner's login in `.env.local`, which stays on this machine.

## Copying to the second place

Copy the whole `backups/` folder. To check a copy without the repo, compare each file's sha256 with `backups/images/manifest.json` (images) or `backups/db/<stamp>/manifest.json` (tables). In PowerShell: `Get-FileHash -Algorithm SHA256 <file>`.

## Restoring

There is deliberately no restore script: a wrong run against the live project would overwrite real data. By hand:

1. **Schema** (only for an empty project): run `supabase/migrations/*.sql` in filename order in the SQL editor. The admin-lockdown migration needs the owner's email in place of its placeholder.
2. **Rows:** insert the table files in the order of `order` in their `manifest.json` (parents first). In the SQL editor, per table:
   ```sql
   insert into public.<table>
   select * from json_populate_recordset(null::public.<table>, '<contents of <table>.json>');
   ```
   Keep the ids, since child tables point at them. For a single table that already has rows, delete the affected rows first or add `on conflict (id) do update …`.
3. **Photos:** `npm run images:backup -- --restore` lists every file a row points at that Storage is missing, and whether the backup has it; `-- --restore --apply` uploads those (sniffed content type, one-year cache, nothing overwritten). A file reported `LOST` was never backed up (added after the last `images:backup -- --apply`): re-upload that photo in the admin. Recipe and ingredient photos migrated in Phase 36 can also be rebuilt from their pre-WebP originals (next section, then `npm run images:migrate -- --force --apply` and `npm run images:check -- --full`).
4. **Check:** `npm run images:audit` (0 missing, 0 orphans), `npm run verify:rls` and `npm run verify:prod`.

One wrong edit doesn't need any of this: fix it in the admin, using the JSON in `backups/db/` as the reference.

## Pre-WebP originals (after Phase 39)

`npm run images:prune-originals -- --apply` deleted the originals from Storage and cleared `original_path` / `image_original_path`; every deleted path is in `scripts/migrate-images/prune-log.json`. To bring them back (e.g. to roll a photo back to its original):

1. Both buckets accept only WebP + PNG since Phase 38, and some originals are JPEG. Allow JPEG for the restore in the SQL editor:
   ```sql
   update storage.buckets set allowed_mime_types = array['image/webp', 'image/png', 'image/jpeg']
   where id in ('recipe-images', 'ingredient-images');
   ```
2. `npm run images:prune-originals -- --restore` (dry run), then `-- --restore --apply`: re-uploads each logged original from `backups/images/` to its old path and sets `original_path` again (one transaction per table).
3. Now `npm run images:flip -- --rollback --apply` points rows back at the originals, exactly as before Phase 39.
4. Put the bucket types back: `supabase/migrations/20261008150000_image_buckets_webp.sql`.

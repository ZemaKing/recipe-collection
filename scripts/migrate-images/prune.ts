// Retires the pre-WebP originals and the superseded first thumbs (ROADMAP Phase 39).
//
//   npm run images:prune-originals                      dry run: what would be deleted, after checks
//   npm run images:prune-originals -- --apply           delete, then clear original_path columns
//   npm run images:prune-originals -- --restore         dry run of putting the originals back
//   npm run images:prune-originals -- --restore --apply re-upload them from backups/images/ and
//                                                       set original_path again (then images:flip
//                                                       -- --rollback --apply works as before)
//
// Before anything is deleted: every original must be in the local backup with a matching sha256,
// and every row must serve its WebP (full + thumb) at the size in the upload manifest. Any problem
// stops --apply. Deletions are recorded in prune-log.json (commit it: the restore reads it).

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { mapPool } from '../images/batch.ts'
import { loadManifest, saveManifest, type Manifest } from '../images/manifest.ts'
import { withRetry } from '../images/retry.ts'
import { formatBytes } from '../lib/util.ts'
import { connect, publicObjectUrl, readAllRows } from '../lib/supabase-script.ts'
import { TABLES, type Table } from './flip.ts'
import { planPrune, type PruneDeletion } from './prune-plan.ts'
import { loadBackupIndex, type BackupIndex } from './sources.ts'
import ingredientJob from './ingredient-job.ts'
import recipeJob from './recipe-job.ts'

type Client = Awaited<ReturnType<typeof connect>>['client']

const LOG = new URL('./prune-log.json', import.meta.url)
const BATCH = 100

interface LogRun {
  at: string
  table: string
  bucket: string
  deleted: PruneDeletion[]
  failed: { path: string; error: string }[]
}

const JOB_VARIANTS: Record<Table['name'], string[]> = {
  recipes: recipeJob.variants.map((v) => v.name),
  ingredients: ingredientJob.variants.map((v) => v.name),
}

function readLog(): LogRun[] {
  return existsSync(LOG) ? (JSON.parse(readFileSync(LOG, 'utf8')) as LogRun[]) : []
}

const sha256File = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex')

// Current dims/thumb of each row, so clearing original_path can pass them through unchanged
// (set_*_image_variants() writes every column it's given).
async function readDims(client: Client, table: Table) {
  if (table.name === 'recipes') {
    const rows = await readAllRows<{
      id: string
      thumb_path: string | null
      width: number | null
      height: number | null
    }>(client, 'recipe_images', 'id, thumb_path, width, height')
    return new Map(rows.map((r) => [r.id, r]))
  }
  const rows = await readAllRows<{
    id: string
    image_width: number | null
    image_height: number | null
  }>(client, 'ingredients', 'id, image_width, image_height')
  return new Map(
    rows.map((r) => [
      r.id,
      { id: r.id, thumb_path: null, width: r.image_width, height: r.image_height },
    ]),
  )
}

// Every row with a deletable original must serve its WebP (and thumb) as recorded in the manifest.
async function checkServed(url: string, table: Table, manifest: Manifest, paths: string[]) {
  const problems: string[] = []
  await mapPool(paths, 8, async (path) => {
    try {
      const response = await withRetry(
        async () => {
          const r = await fetch(publicObjectUrl(url, table.bucket, path), { method: 'HEAD' })
          if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status })
          return r
        },
        { retries: 5 },
      )
      const type = response.headers.get('content-type')
      const length = Number(response.headers.get('content-length'))
      const expected = manifest.objects[path]?.bytes
      if (type !== 'image/webp') problems.push(`${path}: serves ${type}`)
      else if (expected && length && length !== expected)
        problems.push(`${path}: ${length} bytes, manifest says ${expected}`)
    } catch (error) {
      problems.push(`${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
  return problems
}

async function prune(
  client: Client,
  url: string,
  table: Table,
  backup: BackupIndex,
  apply: boolean,
) {
  const manifest = loadManifest(table.manifest, table.job, table.bucket)
  const rows = await table.read(client)
  const plan = planPrune(rows, manifest, table.bucket, backup, {
    full: table.variants.full,
    current: JOB_VARIANTS[table.name],
  })
  const originals = plan.deletions.filter((d) => d.kind === 'original')
  const thumbs = plan.deletions.filter((d) => d.kind === 'superseded-thumb')

  // The backup copy of every original must still hash to the recorded sha256.
  for (const d of originals) {
    const local = backup.get(`${table.bucket}/${d.path}`)!
    if (!existsSync(local.file))
      plan.problems.push(`${d.path}: backup file missing (${local.file})`)
    else if (sha256File(local.file) !== d.sha256)
      plan.problems.push(`${d.path}: backup sha256 differs`)
  }
  const flipped = new Set(originals.map((d) => d.rowId))
  const served = rows
    .filter((r) => flipped.has(r.id))
    .flatMap((r) => [r.path!, ...(r.thumb ? [r.thumb] : [])])
  plan.problems.push(...(await checkServed(url, table, manifest, served)))

  const originalBytes = originals.reduce(
    (n, d) => n + backup.get(`${table.bucket}/${d.path}`)!.bytes,
    0,
  )
  const thumbBytes = thumbs.reduce((n, d) => n + (manifest.objects[d.path]?.bytes ?? 0), 0)
  console.log(`${table.table} (${table.bucket}):`)
  console.log(
    `  originals:         ${originals.length} files, ${formatBytes(originalBytes)} (all in the backup, sha256 checked)`,
  )
  console.log(`  superseded thumbs: ${thumbs.length} files, ${formatBytes(thumbBytes)}`)
  console.log(`  rows checked: ${served.length} WebP URLs serve image/webp at the manifest size`)
  for (const problem of plan.problems) console.log(`  ✖ ${problem}`)
  if (!apply || plan.problems.length || !plan.deletions.length) return plan.problems.length === 0

  // Delete in batches; Storage returns the objects it actually removed.
  const deleted = new Set<string>()
  const failed: LogRun['failed'] = []
  const paths = plan.deletions.map((d) => d.path)
  for (let i = 0; i < paths.length; i += BATCH) {
    const batch = paths.slice(i, i + BATCH)
    const { data, error } = await client.storage.from(table.bucket).remove(batch)
    if (error) failed.push(...batch.map((path) => ({ path, error: error.message })))
    else for (const object of data ?? []) deleted.add(object.name)
  }
  for (const path of paths) {
    if (!deleted.has(path) && !failed.some((f) => f.path === path))
      failed.push({ path, error: 'not removed' })
  }

  const done = plan.deletions.filter((d) => deleted.has(d.path))
  writeFileSync(
    LOG,
    `${JSON.stringify([...readLog(), { at: new Date().toISOString(), table: table.table, bucket: table.bucket, deleted: done, failed }], null, 2)}\n`,
  )

  // Superseded thumbs leave the upload manifest, so images:check keeps checking only live objects.
  const gone = new Set(done.filter((d) => d.kind === 'superseded-thumb').map((d) => d.path))
  if (gone.size) {
    const objects = Object.fromEntries(
      Object.entries(manifest.objects).filter(([p]) => !gone.has(p)),
    )
    saveManifest(table.manifest, { ...manifest, objects })
  }

  // Clear original_path on the rows whose original is gone (one transaction).
  const dims = await readDims(client, table)
  const byId = new Map(rows.map((r) => [r.id, r]))
  const entries = done
    .filter((d) => d.kind === 'original')
    .map((d) => {
      const row = byId.get(d.rowId!)!
      const dim = dims.get(d.rowId!)!
      return {
        id: row.id,
        from_path: row.path,
        to_path: row.path,
        original_path: null,
        ...(table.name === 'recipes' && { thumb_path: dim.thumb_path }),
        width: dim.width,
        height: dim.height,
      }
    })
  if (entries.length) {
    const { data, error } = await client.rpc(table.rpc, { entries })
    if (error) {
      console.log(
        `  ✖ clearing original_path failed: ${error.message} (files are deleted; see prune-log.json)`,
      )
      return false
    }
    console.log(`  ✓ original_path cleared on ${data} row(s)`)
  }
  console.log(
    `  ✓ deleted ${done.length} file(s)${failed.length ? `, ✖ ${failed.length} failed (prune-log.json)` : ''}`,
  )
  return failed.length === 0
}

async function restore(client: Client, table: Table, backup: BackupIndex, apply: boolean) {
  const originals = readLog()
    .filter((run) => run.table === table.table)
    .flatMap((run) => run.deleted.filter((d) => d.kind === 'original'))
  console.log(`${table.table}: ${originals.length} original(s) in prune-log.json`)
  if (!apply || !originals.length) return true

  const rows = new Map((await table.read(client)).map((r) => [r.id, r]))
  const dims = await readDims(client, table)
  const entries = []
  for (const d of originals) {
    const row = rows.get(d.rowId!)
    const local = backup.get(`${table.bucket}/${d.path}`)
    if (!row?.path || !local) {
      console.log(`  ✖ ${d.path}: ${row ? 'not in the backup' : 'row is gone'} — skipped`)
      continue
    }
    const { error } = await client.storage
      .from(table.bucket)
      .upload(d.path, readFileSync(local.file), {
        contentType: local.type ?? undefined,
        cacheControl: '3600',
        upsert: true,
      })
    if (error) {
      console.log(`  ✖ ${d.path}: ${error.message}`)
      continue
    }
    const dim = dims.get(row.id)!
    entries.push({
      id: row.id,
      from_path: row.path,
      to_path: row.path,
      original_path: d.path,
      ...(table.name === 'recipes' && { thumb_path: dim.thumb_path }),
      width: dim.width,
      height: dim.height,
    })
  }
  if (!entries.length) return false
  const { data, error } = await client.rpc(table.rpc, { entries })
  if (error) {
    console.log(`  ✖ setting original_path failed: ${error.message}`)
    return false
  }
  console.log(`  ✓ re-uploaded and linked ${data} original(s); images:flip -- --rollback now works`)
  return entries.length === originals.length
}

export function parsePruneArgs(argv: string[]) {
  const known = new Set(['--apply', '--restore', '--job=recipes', '--job=ingredients'])
  const unknown = argv.filter((a) => !known.has(a))
  if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`)
  const job = argv.find((a) => a.startsWith('--job='))?.slice('--job='.length) ?? null
  return {
    apply: argv.includes('--apply'),
    restore: argv.includes('--restore'),
    tables: TABLES.filter((t) => !job || t.name === job),
  }
}

async function main(argv: string[]): Promise<number> {
  const args = parsePruneArgs(argv)
  const { client, url, mode } = await connect()
  const backup = loadBackupIndex()
  const what = args.restore ? 'RESTORE originals' : 'PRUNE originals + superseded thumbs'
  console.log(
    `${args.apply ? 'APPLYING' : 'DRY RUN (nothing is changed)'} — ${what} (connected as ${mode})\n`,
  )

  let ok = true
  for (const table of args.tables) {
    ok =
      (args.restore
        ? await restore(client, table, backup, args.apply)
        : await prune(client, url, table, backup, args.apply)) && ok
    console.log('')
  }
  if (!args.apply)
    console.log(
      ok ? 'Nothing was changed. Re-run with --apply.' : '✖ Fix the problems above first.',
    )
  return ok ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`✖ ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    },
  )
}

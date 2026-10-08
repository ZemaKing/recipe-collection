// Points image rows at their uploaded WebP variants, or back at the originals (ROADMAP Phase 36).
//
//   npm run images:flip                        dry run: what would change, nothing written
//   npm run images:flip -- --apply             flip recipe_images + ingredients
//   npm run images:flip -- --rollback          dry run of the way back
//   npm run images:flip -- --rollback --apply  back to the originals (they stay in Storage until Phase 39)
//   … --job=recipes | --job=ingredients        one table only
//
// Each table is changed by one call to set_*_image_variants() (20261008140000_image_variant_flip.sql),
// i.e. one transaction that refuses if any row's current path isn't the expected one. Afterwards
// every row's served URL(s) are checked with a HEAD request.

import { pathToFileURL } from 'node:url'

import { loadManifest } from '../images/manifest.ts'
import { mapPool } from '../images/batch.ts'
import { withRetry } from '../images/retry.ts'
import {
  connect,
  INGREDIENT_BUCKET,
  publicObjectUrl,
  readAllRows,
  RECIPE_BUCKET,
} from '../lib/supabase-script.ts'
import { planFlip, type FlipRow } from './flip-plan.ts'
import ingredientJob from './ingredient-job.ts'
import recipeJob from './recipe-job.ts'

type Client = Awaited<ReturnType<typeof connect>>['client']

interface Table {
  name: 'recipes' | 'ingredients'
  table: 'recipe_images' | 'ingredients'
  bucket: string
  rpc: string
  manifest: URL
  job: string
  variants: { full: string; thumb?: string }
  read(client: Client): Promise<(FlipRow & { thumb: string | null })[]>
}

const TABLES: Table[] = [
  {
    name: 'recipes',
    table: 'recipe_images',
    bucket: RECIPE_BUCKET,
    rpc: 'set_recipe_image_variants',
    manifest: recipeJob.manifest,
    job: recipeJob.name,
    variants: { full: 'full', thumb: 'card' }, // the job's thumbnail variant (recipe-job.ts)
    async read(client) {
      const rows = await readAllRows<{
        id: string
        storage_path: string
        original_path: string | null
        thumb_path: string | null
      }>(client, 'recipe_images', 'id, storage_path, original_path, thumb_path')
      return rows.map((r) => ({
        id: r.id,
        path: r.storage_path,
        original: r.original_path,
        thumb: r.thumb_path,
      }))
    },
  },
  {
    name: 'ingredients',
    table: 'ingredients',
    bucket: INGREDIENT_BUCKET,
    rpc: 'set_ingredient_image_variants',
    manifest: ingredientJob.manifest,
    job: ingredientJob.name,
    variants: { full: 'full' },
    async read(client) {
      const rows = await readAllRows<{
        id: string
        image_storage_path: string | null
        image_original_path: string | null
      }>(client, 'ingredients', 'id, image_storage_path, image_original_path')
      return rows.map((r) => ({
        id: r.id,
        path: r.image_storage_path,
        original: r.image_original_path,
        thumb: null,
      }))
    },
  },
]

export function parseFlipArgs(argv: string[]) {
  const known = new Set(['--apply', '--rollback', '--job=recipes', '--job=ingredients'])
  const unknown = argv.filter((a) => !known.has(a))
  if (unknown.length) throw new Error(`Unknown argument(s): ${unknown.join(', ')}`)
  const job = argv.find((a) => a.startsWith('--job='))?.slice('--job='.length) ?? null
  return {
    apply: argv.includes('--apply'),
    direction: argv.includes('--rollback') ? ('rollback' as const) : ('apply' as const),
    tables: TABLES.filter((t) => !job || t.name === job),
  }
}

// Every path the rows point at must answer 200 with the expected kind of content-type.
async function checkServed(url: string, client: Client, table: Table, webp: boolean) {
  const rows = (await table.read(client)).filter((r) => r.path)
  const paths = rows.flatMap((r) => [r.path!, ...(r.thumb ? [r.thumb] : [])])
  const bad: string[] = []
  await mapPool(paths, 8, async (path) => {
    try {
      const response = await withRetry(
        async () => {
          const r = await fetch(publicObjectUrl(url, table.bucket, path), { method: 'HEAD' })
          if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status })
          return r
        },
        { retries: 5 }, // Storage answers 429 to bursts of HEADs
      )
      const type = response.headers.get('content-type') ?? ''
      if ((type === 'image/webp') !== webp) bad.push(`${path}: ${type}`)
    } catch (error) {
      bad.push(`${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
  const flipped = rows.filter((r) => r.original).length
  console.log(
    `  ${table.table}: ${rows.length} rows with a photo, ${flipped} on WebP; ${paths.length - bad.length}/${paths.length} URLs serve ${webp ? 'image/webp' : 'the original type'}`,
  )
  for (const line of bad) console.log(`    ✖ ${line}`)
  return bad.length === 0
}

async function main(argv: string[]): Promise<number> {
  const args = parseFlipArgs(argv)
  const { client, url, mode } = await connect()
  const verb = args.direction === 'apply' ? 'WebP' : 'originals'
  console.log(
    `${args.apply ? 'APPLYING' : 'DRY RUN (nothing is written)'} — point rows at the ${verb} (connected as ${mode})\n`,
  )

  let ok = true
  for (const table of args.tables) {
    const manifest = loadManifest(table.manifest, table.job, table.bucket)
    const plan = planFlip(await table.read(client), manifest, args.direction, table.variants)
    console.log(
      `${table.table}: ${plan.entries.length} to change, ${plan.done.length} already done, ${plan.problems.length} problem(s)`,
    )
    for (const problem of plan.problems) console.log(`  ✖ ${problem}`)
    if (plan.problems.length) {
      ok = false
      continue
    }
    for (const e of plan.entries.slice(0, 3)) console.log(`  ${e.from_path} → ${e.to_path}`)
    if (plan.entries.length > 3) console.log(`  … and ${plan.entries.length - 3} more`)
    if (!args.apply || !plan.entries.length) continue

    const { data, error } = await client.rpc(table.rpc, { entries: plan.entries })
    if (error) {
      console.log(`  ✖ ${table.rpc}: ${error.message} (nothing changed in ${table.table})`)
      ok = false
      continue
    }
    console.log(`  ✓ ${data} row(s) changed in one transaction`)
  }

  if (args.apply) {
    console.log('\nChecking what the rows now serve…')
    for (const table of args.tables) {
      ok = (await checkServed(url, client, table, args.direction === 'apply')) && ok
    }
  } else if (ok) {
    console.log('\nNothing was written. Re-run with --apply.')
  }
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

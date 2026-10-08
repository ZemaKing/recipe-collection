// Phase 34: `npm run db:export` — read-only JSON export of every table to
// backups/db/{timestamp}/ (git-ignored): one {table}.json per table (every row,
// every column) in parent → child order, plus manifest.json with row counts and
// a sha256 per file. Restore steps: docs/backup.md.
//
// pg_dump would need the database password; this goes through the API instead.
// admin_users is only readable with SUPABASE_SERVICE_ROLE_KEY; with the admin
// login it's skipped and the manifest says so.

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { connect, readAllRows } from './lib/supabase-script.ts'

// Parents before children, so a restore can insert the files in this order.
const TABLES = [
  'categories',
  'subcategories',
  'tags',
  'ingredient_categories',
  'ingredients',
  'vitamins',
  'minerals',
  'recipes',
  'recipe_ingredients',
  'recipe_steps',
  'recipe_tags',
  'recipe_images',
  'ingredient_vitamins',
  'ingredient_minerals',
  'kitchen_notes',
  'meal_plan_entries',
  'admin_users',
]
const SERVICE_ROLE_ONLY = new Set(['admin_users'])

try {
  const { client, mode } = await connect()
  console.log(`Connected (${mode}).`)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.join('backups', 'db', stamp)
  await mkdir(dir, { recursive: true })

  const tables: Record<string, { rows: number; sha256: string } | { skipped: string }> = {}
  for (const table of TABLES) {
    if (SERVICE_ROLE_ONLY.has(table) && mode !== 'service-role') {
      tables[table] = { skipped: 'needs SUPABASE_SERVICE_ROLE_KEY' }
      console.log(`${table}: skipped (needs SUPABASE_SERVICE_ROLE_KEY)`)
      continue
    }
    const rows = await readAllRows<Record<string, unknown>>(client, table)
    const json = JSON.stringify(rows, null, 2) + '\n'
    await writeFile(path.join(dir, `${table}.json`), json)
    tables[table] = { rows: rows.length, sha256: createHash('sha256').update(json).digest('hex') }
    console.log(`${table}: ${rows.length} rows`)
  }

  const manifest = { exportedAt: new Date().toISOString(), mode, order: TABLES, tables }
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Wrote ${dir}`)
} catch (error) {
  console.error(`✖ ${(error as Error).message}`)
  process.exitCode = 1
}

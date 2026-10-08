// Phase 33: proves the database only lets the admin write.
//
//   npm run verify:rls
//
// Reads .env.local:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY   (required)
//   RLS_ADMIN_EMAIL, RLS_ADMIN_PASSWORD         (the owner; enables fixture checks)
//   RLS_USER_EMAIL, RLS_USER_PASSWORD           (a signed-in user NOT in admin_users)
//
// Without the admin login only the anon read/list checks run. The non-admin
// user is created by hand: Dashboard -> Authentication -> Add user (works
// with sign-ups disabled); never add it to admin_users.
//
// With the admin login, the script creates one fixture row per table and one
// tiny PNG per bucket (all prefixed rls-verify-<timestamp>), attacks them as
// anon and as the non-admin user, checks they survived, then has the admin
// update and delete them. Cleanup runs even if a check throws. No secret or
// service-role key is used.

import { createClient } from '@supabase/supabase-js'

try {
  process.loadEnvFile('.env.local')
} catch {
  // Fall back to the real environment (e.g. CI).
}

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !anonKey) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (.env.local).')
  process.exit(1)
}

const PREFIX = `rls-verify-${Date.now()}`
const BUCKETS = ['recipe-images', 'ingredient-images']
// 1x1 transparent PNG.
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)
const PUBLIC_TABLES = [
  'categories',
  'subcategories',
  'tags',
  'recipes',
  'recipe_ingredients',
  'recipe_steps',
  'recipe_tags',
  'recipe_images',
  'ingredient_categories',
  'ingredients',
  'vitamins',
  'minerals',
  'ingredient_vitamins',
  'ingredient_minerals',
  'kitchen_notes',
  'meal_plan_entries',
]

let failures = 0
let passes = 0
function check(ok, label, detail = '') {
  if (ok) passes++
  else failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`)
}

function newClient() {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function signedIn(email, password, label) {
  const client = newClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`${label} sign-in failed: ${error.message}`)
  return client
}

// RLS refuses an INSERT with 42501 before any constraint runs; UPDATE/DELETE
// are silently filtered to zero rows.
const refusedInsert = (error) => error?.code === '42501'
const describe = (error, data) =>
  error ? `${error.code ?? ''} ${error.message}` : `returned ${data?.length ?? 0} row(s)`

// --- anon, no fixtures needed ------------------------------------------------

async function anonChecks(anon) {
  console.log('\n# anon: reads')
  for (const table of PUBLIC_TABLES) {
    const { error } = await anon.from(table).select('*', { count: 'exact', head: true })
    check(!error, `anon can read ${table}`, error?.message)
  }

  const adminUsers = await anon.from('admin_users').select('user_id')
  check(
    !!adminUsers.error,
    'anon cannot read admin_users',
    describe(adminUsers.error, adminUsers.data),
  )

  const rpc = await anon.rpc('is_admin')
  check(!!rpc.error || rpc.data === false, 'anon is not admin', `is_admin() = ${rpc.data}`)

  console.log('\n# anon: storage listing')
  for (const bucket of BUCKETS) {
    const { data, error } = await anon.storage.from(bucket).list('', { limit: 5 })
    check(!!error || data.length === 0, `anon cannot list ${bucket}`, describe(error, data))
  }
}

// --- fixtures ----------------------------------------------------------------

// Built in dependency order; `key` identifies the row, `patch` is the update
// the attackers try (and the admin then performs). Pushes into `fixtures` as
// it goes, so cleanup sees whatever was created if a later insert fails.
async function createFixtures(admin, fixtures) {
  async function insert(table, row, keyColumns, patch) {
    const { data, error } = await admin.from(table).insert(row).select().single()
    if (error) throw new Error(`admin could not create ${table} fixture: ${error.message}`)
    const key = Object.fromEntries(keyColumns.map((column) => [column, data[column]]))
    fixtures.push({ table, row, key, patch })
    return data
  }

  const name_en = PREFIX
  const category = await insert('categories', { slug: PREFIX, name_en }, ['id'], {
    name_en: `${PREFIX}-x`,
  })
  await insert(
    'subcategories',
    { category_id: category.id, slug: PREFIX, name_en, name_sr: name_en },
    ['id'],
    {
      name_en: `${PREFIX}-x`,
    },
  )
  const tag = await insert('tags', { slug: PREFIX, name_en }, ['id'], { name_en: `${PREFIX}-x` })
  const recipe = await insert(
    'recipes',
    { slug: PREFIX, category_id: category.id, name_en },
    ['id'],
    {
      name_en: `${PREFIX}-x`,
    },
  )
  await insert('recipe_ingredients', { recipe_id: recipe.id, order_index: 0, name_en }, ['id'], {
    name_en: `${PREFIX}-x`,
  })
  await insert('recipe_steps', { recipe_id: recipe.id, step_number: 1, text_en: name_en }, ['id'], {
    text_en: `${PREFIX}-x`,
  })
  await insert('recipe_tags', { recipe_id: recipe.id, tag_id: tag.id }, ['recipe_id', 'tag_id'], {
    created_at: new Date().toISOString(),
  })
  await insert(
    'recipe_images',
    { recipe_id: recipe.id, storage_path: `${PREFIX}/probe.png` },
    ['id'],
    {
      alt_en: PREFIX,
    },
  )
  const ingredientCategory = await insert(
    'ingredient_categories',
    { slug: PREFIX, name_en },
    ['id'],
    {
      name_en: `${PREFIX}-x`,
    },
  )
  const ingredient = await insert(
    'ingredients',
    { slug: PREFIX, name_en, ingredient_category_id: ingredientCategory.id },
    ['id'],
    { name_en: `${PREFIX}-x` },
  )
  const vitamin = await insert(
    'vitamins',
    { code: PREFIX, name_en, name_sr: name_en, unit: 'mg' },
    ['id'],
    {
      name_en: `${PREFIX}-x`,
    },
  )
  const mineral = await insert(
    'minerals',
    { code: PREFIX, name_en, name_sr: name_en, unit: 'mg' },
    ['id'],
    {
      name_en: `${PREFIX}-x`,
    },
  )
  await insert(
    'ingredient_vitamins',
    { ingredient_id: ingredient.id, vitamin_id: vitamin.id, amount_per_100g: 1 },
    ['ingredient_id', 'vitamin_id'],
    { amount_per_100g: 2 },
  )
  await insert(
    'ingredient_minerals',
    { ingredient_id: ingredient.id, mineral_id: mineral.id, amount_per_100g: 1 },
    ['ingredient_id', 'mineral_id'],
    { amount_per_100g: 2 },
  )
  await insert('kitchen_notes', { recipe_id: recipe.id, title_en: PREFIX }, ['id'], {
    body_en: PREFIX,
  })
  // (plan_date, slot) is unique; a date in 1900 can't clash with real plans.
  const day = String((Date.now() % 28) + 1).padStart(2, '0')
  await insert(
    'meal_plan_entries',
    { recipe_id: recipe.id, plan_date: `1900-01-${day}`, slot: 'snack', note: PREFIX },
    ['id'],
    { note: `${PREFIX}-x` },
  )

  for (const bucket of BUCKETS) {
    const { error } = await admin.storage
      .from(bucket)
      .upload(`${PREFIX}/probe.png`, PNG, { contentType: 'image/png', upsert: false })
    if (error) throw new Error(`admin could not upload to ${bucket}: ${error.message}`)
  }
}

async function attack(client, who, fixtures) {
  console.log(`\n# ${who}: writes`)
  for (const { table, row, key, patch } of fixtures) {
    const inserted = await client.from(table).insert(row).select()
    check(
      refusedInsert(inserted.error),
      `${who} cannot insert into ${table}`,
      describe(inserted.error, inserted.data),
    )

    const updated = await client.from(table).update(patch).match(key).select()
    check(
      (updated.data ?? []).length === 0,
      `${who} cannot update ${table}`,
      describe(updated.error, updated.data),
    )

    const deleted = await client.from(table).delete().match(key).select()
    check(
      (deleted.data ?? []).length === 0,
      `${who} cannot delete from ${table}`,
      describe(deleted.error, deleted.data),
    )
  }

  console.log(`\n# ${who}: storage`)
  for (const bucket of BUCKETS) {
    const storage = client.storage.from(bucket)
    const upload = await storage.upload(`${PREFIX}/intruder.png`, PNG, { contentType: 'image/png' })
    check(!!upload.error, `${who} cannot upload to ${bucket}`, 'upload succeeded')

    const list = await storage.list(PREFIX)
    check(
      !!list.error || list.data.length === 0,
      `${who} cannot list ${bucket}`,
      describe(list.error, list.data),
    )

    const removed = await storage.remove([`${PREFIX}/probe.png`])
    check(
      !!removed.error || removed.data.length === 0,
      `${who} cannot delete from ${bucket}`,
      describe(removed.error, removed.data),
    )
  }
}

async function adminChecks(admin, fixtures) {
  console.log('\n# admin: fixtures survived the attacks')
  for (const { table, key } of fixtures) {
    const { count, error } = await admin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .match(key)
    check(count === 1, `${table} fixture intact`, error?.message ?? `count ${count}`)
  }
  for (const bucket of BUCKETS) {
    const { data, error } = await admin.storage.from(bucket).list(PREFIX)
    const names = (data ?? []).map((file) => file.name)
    check(
      names.includes('probe.png'),
      `${bucket} probe intact and listable by admin`,
      error?.message ?? names.join(','),
    )
    check(!names.includes('intruder.png'), `${bucket} has no intruder upload`)

    const publicUrl = admin.storage.from(bucket).getPublicUrl(`${PREFIX}/probe.png`).data.publicUrl
    const response = await fetch(publicUrl, { method: 'HEAD' })
    check(response.ok, `${bucket} probe served by public URL`, `HTTP ${response.status}`)

    const wrongType = await admin.storage
      .from(bucket)
      .upload(`${PREFIX}/note.txt`, new TextEncoder().encode('x'), { contentType: 'text/plain' })
    check(
      !!wrongType.error,
      `${bucket} rejects non-image uploads (allowed_mime_types)`,
      'text/plain accepted',
    )
  }

  console.log('\n# admin: writes')
  for (const { table, key, patch } of fixtures) {
    const { data, error } = await admin.from(table).update(patch).match(key).select()
    check((data ?? []).length === 1, `admin can update ${table}`, describe(error, data))
  }
}

// Reverse dependency order; also sweeps anything an attacker managed to add.
async function cleanup(admin, fixtures) {
  console.log('\n# cleanup')
  for (const { table, key } of [...fixtures].reverse()) {
    const { error } = await admin.from(table).delete().match(key)
    if (error) console.log(`WARN  could not delete ${table} fixture: ${error.message}`)
  }
  for (const [table, column] of [
    ['kitchen_notes', 'title_en'],
    ['meal_plan_entries', 'note'],
    ['recipes', 'slug'],
    ['subcategories', 'slug'],
    ['categories', 'slug'],
    ['tags', 'slug'],
    ['ingredients', 'slug'],
    ['ingredient_categories', 'slug'],
    ['vitamins', 'code'],
    ['minerals', 'code'],
  ]) {
    await admin.from(table).delete().like(column, `${PREFIX}%`)
  }
  for (const bucket of BUCKETS) {
    const storage = admin.storage.from(bucket)
    const { data } = await storage.list(PREFIX)
    const paths = (data ?? []).map((file) => `${PREFIX}/${file.name}`)
    if (paths.length > 0) {
      const { error } = await storage.remove(paths)
      if (error) console.log(`WARN  could not delete ${bucket}/${PREFIX}: ${error.message}`)
    }
  }
  for (const { table, key } of fixtures) {
    const { count } = await admin.from(table).select('*', { count: 'exact', head: true }).match(key)
    check(count === 0, `admin deleted ${table} fixture`, `count ${count}`)
  }
}

async function main() {
  const anon = newClient()
  await anonChecks(anon)

  const { RLS_ADMIN_EMAIL, RLS_ADMIN_PASSWORD, RLS_USER_EMAIL, RLS_USER_PASSWORD } = process.env
  if (!RLS_ADMIN_EMAIL || !RLS_ADMIN_PASSWORD) {
    console.log('\nSKIP  write checks: set RLS_ADMIN_EMAIL / RLS_ADMIN_PASSWORD in .env.local')
    return
  }

  const admin = await signedIn(RLS_ADMIN_EMAIL, RLS_ADMIN_PASSWORD, 'admin')
  const adminRpc = await admin.rpc('is_admin')
  check(
    adminRpc.data === true,
    'admin is_admin() = true',
    adminRpc.error?.message ?? String(adminRpc.data),
  )
  if (adminRpc.data !== true) return

  let user = null
  if (RLS_USER_EMAIL && RLS_USER_PASSWORD) {
    user = await signedIn(RLS_USER_EMAIL, RLS_USER_PASSWORD, 'non-admin user')
    const userRpc = await user.rpc('is_admin')
    check(
      userRpc.data === false,
      'non-admin user is_admin() = false',
      userRpc.error?.message ?? String(userRpc.data),
    )
  } else {
    console.log('\nSKIP  non-admin checks: set RLS_USER_EMAIL / RLS_USER_PASSWORD in .env.local')
  }

  const fixtures = []
  try {
    console.log(`\n# admin: creating fixtures (${PREFIX})`)
    await createFixtures(admin, fixtures)
    check(
      true,
      `admin created ${fixtures.length} table fixtures + ${BUCKETS.length} storage probes`,
    )

    await attack(anon, 'anon', fixtures)
    if (user) await attack(user, 'non-admin', fixtures)
    await adminChecks(admin, fixtures)
  } finally {
    await cleanup(admin, fixtures)
  }
}

try {
  await main()
} catch (error) {
  failures++
  console.error(`\nERROR ${error.message}`)
}

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures > 0 ? 1 : 0)

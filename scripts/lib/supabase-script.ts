// Shared setup for the Node scripts (images:audit, images:backup, db:export).
//
// Reads .env.local. Connects with SUPABASE_SERVICE_ROLE_KEY when it's set,
// otherwise signs in as the owner (RLS_ADMIN_EMAIL / RLS_ADMIN_PASSWORD), whose
// is_admin() policies allow listing both buckets and reading every table except
// admin_users. Neither secret is ever VITE_-prefixed or committed.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const RECIPE_BUCKET = 'recipe-images'
export const INGREDIENT_BUCKET = 'ingredient-images'
export const BUCKETS = [RECIPE_BUCKET, INGREDIENT_BUCKET] as const
export type Bucket = (typeof BUCKETS)[number]

export interface ScriptConnection {
  client: SupabaseClient
  url: string
  mode: 'service-role' | 'admin-login'
}

export function loadEnv(): void {
  try {
    process.loadEnvFile('.env.local')
  } catch {
    // Fall back to the real environment.
  }
}

export async function connect(): Promise<ScriptConnection> {
  loadEnv()
  const url = process.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '')
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const email = process.env.RLS_ADMIN_EMAIL?.trim()
  const password = process.env.RLS_ADMIN_PASSWORD
  const options = { auth: { persistSession: false, autoRefreshToken: false } }

  if (!url) throw new Error('VITE_SUPABASE_URL must be set (.env.local).')
  if (serviceKey) {
    return { client: createClient(url, serviceKey, options), url, mode: 'service-role' }
  }
  if (!anonKey || !email || !password) {
    throw new Error(
      'Set SUPABASE_SERVICE_ROLE_KEY, or VITE_SUPABASE_ANON_KEY + RLS_ADMIN_EMAIL + RLS_ADMIN_PASSWORD (.env.local).',
    )
  }
  const client = createClient(url, anonKey, options)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Admin sign-in failed: ${error.message}`)
  return { client, url, mode: 'admin-login' }
}

export function publicObjectUrl(url: string, bucket: string, path: string): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${url}/storage/v1/object/public/${bucket}/${encoded}`
}

export interface StorageObject {
  path: string
  bytes: number
  mimetype: string | null
  etag: string | null
  /** As stored on the object (what a GET serves; a HEAD says no-cache). */
  cacheControl: string | null
  updatedAt: string | null
}

const PAGE = 1000

function listOnce(client: SupabaseClient, bucket: string, prefix: string, offset: number) {
  return client.storage
    .from(bucket)
    .list(prefix, { limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } })
}

// Storage lists one folder level at a time; entries without an id are folders.
export async function listBucket(
  client: SupabaseClient,
  bucket: string,
  prefix = '',
): Promise<StorageObject[]> {
  const objects: StorageObject[] = []
  for (let offset = 0; ; offset += PAGE) {
    // Storage sometimes answers "Too many connections" during a burst of
    // folder listings; a short back-off clears it.
    let { data, error } = await listOnce(client, bucket, prefix, offset)
    for (let attempt = 1; error && attempt <= 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      ;({ data, error } = await listOnce(client, bucket, prefix, offset))
    }
    if (error || !data) throw new Error(`list ${bucket}/${prefix}: ${error?.message}`)
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id) {
        const meta = (entry.metadata ?? {}) as Record<string, unknown>
        objects.push({
          path,
          bytes: Number(meta.size ?? 0),
          mimetype: typeof meta.mimetype === 'string' ? meta.mimetype : null,
          etag: typeof meta.eTag === 'string' ? meta.eTag.replaceAll('"', '') : null,
          cacheControl: typeof meta.cacheControl === 'string' ? meta.cacheControl : null,
          updatedAt: entry.updated_at ?? null,
        })
      } else {
        objects.push(...(await listBucket(client, bucket, path)))
      }
    }
    if (data.length < PAGE) return objects
  }
}

export async function readAllRows<T>(
  client: SupabaseClient,
  table: string,
  select = '*',
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`read ${table}: ${error.message}`)
    rows.push(...(data as T[]))
    if (data.length < PAGE) return rows
  }
}

export interface ImageReference {
  bucket: Bucket
  table: 'recipe_images' | 'ingredients'
  rowId: string
  path: string
}

// Every Storage path the database points at, per bucket: the image, a recipe
// photo's thumbnail and, until Phase 39 retires them, pre-WebP originals.
export async function readImageReferences(client: SupabaseClient): Promise<ImageReference[]> {
  const recipeRows = await readAllRows<{
    id: string
    storage_path: string
    thumb_path: string | null
    original_path: string | null
  }>(client, 'recipe_images', 'id, storage_path, thumb_path, original_path')
  const ingredientRows = await readAllRows<{
    id: string
    image_storage_path: string | null
    image_original_path: string | null
  }>(client, 'ingredients', 'id, image_storage_path, image_original_path')
  return [
    ...recipeRows.flatMap((row) =>
      [row.storage_path, row.thumb_path, row.original_path]
        .filter((path): path is string => !!path)
        .map((path): ImageReference => ({
          bucket: RECIPE_BUCKET,
          table: 'recipe_images',
          rowId: row.id,
          path,
        })),
    ),
    ...ingredientRows.flatMap((row) =>
      [row.image_storage_path, row.image_original_path]
        .filter((path): path is string => !!path)
        .map((path): ImageReference => ({
          bucket: INGREDIENT_BUCKET,
          table: 'ingredients',
          rowId: row.id,
          path,
        })),
    ),
  ]
}

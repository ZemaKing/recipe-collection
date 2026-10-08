// Supabase Storage as the pipeline's StorageTarget. The client comes from scripts/lib/supabase-script.ts
// (service-role key, or the admin login whose is_admin() policies allow writing both buckets) —
// recipes port; diecast's copy builds its own service-role client here.
import type { SupabaseClient } from '@supabase/supabase-js'

import type { StorageTarget } from './types.ts'

// "Object not found" comes back as 400 or 404 depending on the Storage version.
const isNotFound = (error: { message?: string; status?: unknown }) =>
  Number(error.status) === 404 || /not.?found/i.test(error.message ?? '')

export function supabaseTarget(supabase: SupabaseClient, bucket: string): StorageTarget {
  const files = () => supabase.storage.from(bucket)
  return {
    async stat(path) {
      const { data, error } = await files().info(path)
      if (error) {
        if (isNotFound(error) && !/bucket/i.test(error.message)) return null
        throw error
      }
      return { size: data.size ?? -1 }
    },
    async upload(path, data, { contentType, cacheControl }) {
      const { error } = await files().upload(path, data, {
        contentType,
        cacheControl,
        upsert: true,
      })
      if (error) throw error
    },
    publicUrl: (path) => files().getPublicUrl(path).data.publicUrl,
  }
}

// Before a real run: the bucket must exist, be public and accept WebP, or uploads fail / every
// public URL 400s. Reading bucket settings needs the service role; with the admin login a listing
// at least proves the bucket exists and is writable-by-policy (verify then checks public URLs).
export async function checkBucket(supabase: SupabaseClient, bucket: string): Promise<void> {
  const { data, error } = await supabase.storage.getBucket(bucket)
  if (data) {
    if (!data.public) throw new Error(`Bucket "${bucket}" is not public.`)
    const types = data.allowed_mime_types
    if (types?.length && !types.includes('image/webp')) {
      throw new Error(`Bucket "${bucket}" doesn't accept image/webp (${types.join(', ')}).`)
    }
    return
  }
  const listing = await supabase.storage.from(bucket).list('', { limit: 1 })
  if (listing.error) {
    throw new Error(
      `Bucket "${bucket}" not reachable (${error?.message ?? listing.error.message}) — apply its migration first.`,
    )
  }
}

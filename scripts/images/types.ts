// Types for the reusable image pipeline (diecast ROADMAP Phase 21, ported to recipes in Phase 35). Nothing in scripts/images/ knows about
// the app that uses it: an app describes its images as an ImageJob (see README.md) and runs the CLI.
import type { SupabaseClient } from '@supabase/supabase-js'

// One output size. Every variant is WebP, resized to fit inside maxWidth × maxHeight (never
// enlarged), EXIF-rotated and stripped of metadata.
export type Variant = {
  name: string // fills {variant} in the path pattern, e.g. "full" | "thumb"
  maxWidth: number
  maxHeight?: number // default: maxWidth, i.e. the longest edge is bounded
  quality: number // WebP quality, 1–100
  // 'inside' (default): both edges ≤ the box. 'outside' (recipes port): the box is covered, i.e.
  // the *short* edge is bounded — for thumbs that get cropped to a square in the UI.
  fit?: 'inside' | 'outside'
  // Overrides the job's pathPattern for this variant, e.g. "{folder}/{name}.thumb.{ext}" next to
  // a full variant at "{folder}/{name}.{ext}" (recipes port).
  pathPattern?: string
}

// One original image to convert. `vars` fill the path pattern's placeholders.
export type ImageSource = {
  key: string // unique and stable — used in logs, --only and the manifest
  url: string // where the original lives; recorded in the manifest as the source's identity
  // Local copy of the original (recipes port). When set, it is read from disk instead of
  // downloading `url`, so a migration costs no egress. With `sha256`, a copy that doesn't match
  // fails that source (permanently, not retried).
  file?: string
  sha256?: string
  vars: Record<string, string | number>
}

export type ImageJob = {
  name: string
  bucket: string
  // Storage key per source × variant. Placeholders: {variant}, {ext} ("webp") + the source's vars.
  pathPattern: string
  variants: Variant[]
  // Resume state + checksums (JSON). Rewritten after every source, so an interrupted run resumes.
  manifest: URL
  cacheControl?: string // seconds, default 604800 (a week)
  concurrency?: number // default 4
  retries?: number // default 4 (so up to 5 attempts per request)
  sources(supabase: SupabaseClient): Promise<ImageSource[]>
}

// Where the converted files go. `supabaseTarget()` is the real one; tests use an in-memory fake.
export interface StorageTarget {
  stat(path: string): Promise<{ size: number } | null>
  upload(
    path: string,
    data: Buffer,
    options: { contentType: string; cacheControl: string },
  ): Promise<void>
  publicUrl(path: string): string
}

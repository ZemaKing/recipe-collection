// Pure part of `npm run images:backup`: decides which bucket objects still need
// downloading, given the existing manifest and what is on disk.

import type { StorageObject } from './supabase-script.ts'

export interface ManifestEntry {
  bucket: string
  path: string
  bytes: number
  sha256: string
  etag: string | null
  /** Sniffed from the bytes, e.g. image/png — not the Storage content-type. */
  type: string | null
  width: number | null
  height: number | null
  downloadedAt: string
}

export interface BackupManifest {
  version: 1
  updatedAt: string
  entries: ManifestEntry[]
}

export interface LocalFile {
  bytes: number
  sha256: string
}

export type PlanReason =
  'new' | 'missing-locally' | 'size-changed' | 'etag-changed' | 'checksum-mismatch'

export interface BackupPlan {
  download: { bucket: string; object: StorageObject; reason: PlanReason }[]
  upToDate: { bucket: string; object: StorageObject }[]
  /** In the manifest but no longer in the bucket. The local copy is kept. */
  goneFromBucket: ManifestEntry[]
  downloadBytes: number
}

export function entryKey(bucket: string, path: string): string {
  return `${bucket}/${path}`
}

export function planBackup(
  objectsByBucket: Record<string, StorageObject[]>,
  manifest: BackupManifest | null,
  localFiles: Map<string, LocalFile>,
): BackupPlan {
  const entries = new Map(
    (manifest?.entries ?? []).map((entry) => [entryKey(entry.bucket, entry.path), entry]),
  )
  const plan: BackupPlan = { download: [], upToDate: [], goneFromBucket: [], downloadBytes: 0 }
  const seen = new Set<string>()

  for (const [bucket, objects] of Object.entries(objectsByBucket)) {
    for (const object of objects) {
      const key = entryKey(bucket, object.path)
      seen.add(key)
      const entry = entries.get(key)
      const local = localFiles.get(key)
      let reason: PlanReason | null = null
      if (!entry) reason = 'new'
      else if (!local) reason = 'missing-locally'
      else if (entry.bytes !== object.bytes || local.bytes !== object.bytes) reason = 'size-changed'
      else if (entry.etag && object.etag && entry.etag !== object.etag) reason = 'etag-changed'
      else if (local.sha256 !== entry.sha256) reason = 'checksum-mismatch'

      if (reason) {
        plan.download.push({ bucket, object, reason })
        plan.downloadBytes += object.bytes
      } else {
        plan.upToDate.push({ bucket, object })
      }
    }
  }
  plan.goneFromBucket = [...entries.values()].filter(
    (entry) => !seen.has(entryKey(entry.bucket, entry.path)),
  )
  return plan
}

// Replaces (or adds) one entry, keeping the list sorted so the file diffs cleanly.
export function upsertEntry(
  manifest: BackupManifest,
  entry: ManifestEntry,
  now: string,
): BackupManifest {
  const key = entryKey(entry.bucket, entry.path)
  const entries = manifest.entries.filter(
    (existing) => entryKey(existing.bucket, existing.path) !== key,
  )
  entries.push(entry)
  entries.sort((a, b) => entryKey(a.bucket, a.path).localeCompare(entryKey(b.bucket, b.path)))
  return { version: 1, updatedAt: now, entries }
}

export interface RestorePlan {
  /** Referenced by a row, missing from its bucket, and in the backup: re-upload these. */
  upload: ManifestEntry[]
  /** Referenced by a row, missing from its bucket and NOT in the backup. */
  lost: { bucket: string; path: string }[]
  /** Referenced paths that are still in their bucket (left alone). */
  present: number
}

// `images:backup -- --restore`: only paths a row points at and Storage no longer has. Never
// anything still in a bucket (no overwrites), never a backed-up file no row uses (e.g. the
// pre-WebP originals retired in Phase 39).
export function planRestore(
  references: { bucket: string; path: string }[],
  inBucket: Set<string>,
  manifest: BackupManifest | null,
): RestorePlan {
  const entries = new Map(
    (manifest?.entries ?? []).map((entry) => [entryKey(entry.bucket, entry.path), entry]),
  )
  const plan: RestorePlan = { upload: [], lost: [], present: 0 }
  const seen = new Set<string>()
  for (const { bucket, path } of references) {
    const key = entryKey(bucket, path)
    if (seen.has(key)) continue
    seen.add(key)
    const entry = entries.get(key)
    if (inBucket.has(key)) plan.present++
    else if (entry) plan.upload.push(entry)
    else plan.lost.push({ bucket, path })
  }
  return plan
}

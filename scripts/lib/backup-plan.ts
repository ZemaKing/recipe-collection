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

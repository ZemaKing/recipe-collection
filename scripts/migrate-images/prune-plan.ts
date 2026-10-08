// Pure part of `npm run images:prune-originals` (ROADMAP Phase 39): which Storage objects can go.
//
//   original          a row's original_path / image_original_path, once the row points at the
//                     migrated WebP from the manifest and the original is in the local backup
//   superseded-thumb  a WebP the migration uploaded for a variant the job no longer has (the first
//                     500×333 `.thumb.webp`, replaced by `.card.webp` in Phase 37), if no row uses it
//
// Nothing that any row still points at is ever deleted.

import type { Manifest } from '../images/manifest.ts'
import { outputsBySource, type FlipRow } from './flip-plan.ts'

export interface PruneRow extends FlipRow {
  thumb?: string | null
}

export interface PruneDeletion {
  kind: 'original' | 'superseded-thumb'
  path: string
  rowId?: string // originals: the row whose original_path is cleared afterwards
  sha256?: string // originals: from the backup manifest, for the restore
}

export interface PrunePlan {
  deletions: PruneDeletion[]
  problems: string[]
}

export function planPrune(
  rows: PruneRow[],
  manifest: Manifest,
  bucket: string,
  backup: Map<string, { sha256: string }>, // `${bucket}/${path}` → backup entry
  variants: { full: string; current: string[] }, // current: the job's variant names
): PrunePlan {
  const plan: PrunePlan = { deletions: [], problems: [] }
  const referenced = new Set(rows.flatMap((r) => [r.path, r.thumb]).filter(Boolean))
  const outputs = outputsBySource(manifest)

  for (const row of rows) {
    if (!row.original) continue
    const full = outputs.get(row.original)?.[variants.full]
    const backed = backup.get(`${bucket}/${row.original}`)
    if (!full || row.path !== full.path) {
      plan.problems.push(`${row.id}: points at ${row.path}, not its migrated WebP — kept`)
    } else if (!backed) {
      plan.problems.push(`${row.id}: ${row.original} is not in the backup — kept`)
    } else if (referenced.has(row.original)) {
      plan.problems.push(`${row.id}: ${row.original} is still used by a row — kept`)
    } else {
      plan.deletions.push({
        kind: 'original',
        path: row.original,
        rowId: row.id,
        sha256: backed.sha256,
      })
    }
  }

  for (const [path, entry] of Object.entries(manifest.objects)) {
    if (variants.current.includes(entry.variant) || referenced.has(path)) continue
    plan.deletions.push({ kind: 'superseded-thumb', path })
  }
  return plan
}

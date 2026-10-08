// Pure part of `npm run images:flip`: which rows to point at their WebP variants (or back at the
// originals), checked against the upload manifest. The DB functions re-check every from_path, so a
// row that changed in between makes the whole flip fail instead of half-applying.

import type { Manifest } from '../images/manifest.ts'

/** A row normalised from recipe_images or ingredients. */
export interface FlipRow {
  id: string
  path: string | null // storage_path / image_storage_path
  original: string | null // original_path / image_original_path
}

/** What set_*_image_variants() takes, per row. */
export interface FlipEntry {
  id: string
  from_path: string
  to_path: string
  original_path: string | null
  thumb_path?: string | null
  width: number | null
  height: number | null
}

export interface FlipPlan {
  entries: FlipEntry[]
  done: string[] // ids already in the wanted state
  problems: string[] // anything that blocks the flip
}

/** The manifest's outputs per source key (= the original's storage path), by variant name. */
export function outputsBySource(manifest: Manifest) {
  const bySource = new Map<
    string,
    Record<string, { path: string; width: number; height: number }>
  >()
  for (const [path, entry] of Object.entries(manifest.objects)) {
    const outputs = bySource.get(entry.source) ?? {}
    outputs[entry.variant] = { path, width: entry.width, height: entry.height }
    bySource.set(entry.source, outputs)
  }
  return bySource
}

export function planFlip(
  rows: FlipRow[],
  manifest: Manifest,
  direction: 'apply' | 'rollback',
  variants: { full: string; thumb?: string },
): FlipPlan {
  const outputs = outputsBySource(manifest)
  const plan: FlipPlan = { entries: [], done: [], problems: [] }

  for (const row of rows) {
    if (!row.path) continue // ingredient without a photo
    if (direction === 'apply') {
      const flipped = row.original !== null
      const source = flipped ? row.original! : row.path
      const out = outputs.get(source)
      const full = out?.[variants.full]
      const thumb = variants.thumb ? out?.[variants.thumb] : undefined
      if (!full || (variants.thumb && !thumb)) {
        plan.problems.push(`${row.id}: no uploaded WebP for ${source} in the manifest`)
      } else if (flipped) {
        if (row.path === full.path) plan.done.push(row.id)
        else
          plan.problems.push(
            `${row.id}: has original_path but points at ${row.path}, not ${full.path}`,
          )
      } else {
        plan.entries.push({
          id: row.id,
          from_path: row.path,
          to_path: full.path,
          original_path: row.path,
          ...(variants.thumb && { thumb_path: thumb!.path }),
          width: full.width,
          height: full.height,
        })
      }
    } else {
      if (!row.original) {
        plan.done.push(row.id)
        continue
      }
      const full = outputs.get(row.original)?.[variants.full]
      if (full && row.path !== full.path) {
        plan.problems.push(`${row.id}: points at ${row.path}, not the migrated ${full.path}`)
        continue
      }
      plan.entries.push({
        id: row.id,
        from_path: row.path,
        to_path: row.original,
        original_path: null,
        ...(variants.thumb && { thumb_path: null }),
        width: null,
        height: null,
      })
    }
  }
  return plan
}

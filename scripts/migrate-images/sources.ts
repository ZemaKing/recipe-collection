// Turns database rows into ImageSources for the generic pipeline (scripts/images/), reading each
// original from the Phase 34 backup (backups/images/) when it's there, so the migration costs no
// download egress. Pure apart from loadBackupIndex().

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { ImageSource } from '../images/types.ts'
import type { BackupManifest } from '../lib/backup-plan.ts'

export const BACKUP_DIR = new URL('../../backups/images/', import.meta.url)

/** `{bucket}/{path}` → the local copy and its recorded sha256. */
export type BackupIndex = Map<string, { file: string; sha256: string }>

export function backupIndex(manifest: BackupManifest | null, dir: URL = BACKUP_DIR): BackupIndex {
  const index: BackupIndex = new Map()
  for (const entry of manifest?.entries ?? []) {
    index.set(`${entry.bucket}/${entry.path}`, {
      file: fileURLToPath(new URL(`${entry.bucket}/${entry.path}`, dir)),
      sha256: entry.sha256,
    })
  }
  return index
}

export function loadBackupIndex(dir: URL = BACKUP_DIR): BackupIndex {
  const file = new URL('manifest.json', dir)
  if (!existsSync(file)) return new Map()
  return backupIndex(JSON.parse(readFileSync(file, 'utf8')) as BackupManifest, dir)
}

/** An image row: its id and the path of the original (`original_path ?? storage_path`). */
export interface ImageRow {
  id: string
  path: string
}

// "{folder}/{name}.{ext}" → vars for the job's path patterns. The output keeps the folder and the
// file's UUID and only swaps the extension, so it never collides with another row's object.
export function pathVars(path: string): { folder: string; name: string } {
  const match = /^([^/]+)\/([^/]+)\.([A-Za-z0-9]+)$/.exec(path)
  if (!match) throw new Error(`Unexpected storage path "${path}" (want {folder}/{name}.{ext}).`)
  const [, folder, name, ext] = match
  // A .webp original would be overwritten by its own output.
  if (ext.toLowerCase() === 'webp')
    throw new Error(`"${path}" is already WebP; nothing to convert.`)
  return { folder, name }
}

// Key = the original's storage path: unique, stable, and what the Phase 36 flip matches rows on.
export function rowsToSources(
  rows: ImageRow[],
  bucket: string,
  publicUrl: (path: string) => string,
  backups: BackupIndex,
): ImageSource[] {
  return [...rows]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((row) => {
      const local = backups.get(`${bucket}/${row.path}`)
      return {
        key: row.path,
        url: publicUrl(row.path),
        ...(local && { file: local.file, sha256: local.sha256 }),
        vars: pathVars(row.path),
      }
    })
}

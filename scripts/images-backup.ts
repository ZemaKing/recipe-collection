// Phase 34: `npm run images:backup` — local, checksummed copy of both buckets.
//
//   npm run images:backup                 dry run: what would be downloaded, and how many bytes
//   npm run images:backup -- --apply      download it (counts against the org's shared egress)
//   npm run images:backup -- --verify     offline: re-hash every local file against the manifest
//   npm run images:backup -- --restore    dry run: files rows point at that Storage has lost
//   npm run images:backup -- --restore --apply   re-upload those from the local copy
//
// Files go to backups/images/{bucket}/{path} (git-ignored), with
// backups/images/manifest.json holding bytes, sha256, ETag, sniffed type and
// pixel size per object. The manifest is saved after every file, so an
// interrupted run resumes where it stopped; objects whose local copy still
// matches are skipped. Nothing in Storage is ever written or deleted, and a
// local copy is never deleted, even when its object is gone from the bucket.
//
// --restore is the only mode that writes to Storage, and only to paths that are both referenced
// by a row and missing from the bucket (upsert: false, so nothing is overwritten). Each file is
// re-hashed against the manifest before upload. See docs/backup.md → Restoring.

import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  entryKey,
  planBackup,
  planRestore,
  upsertEntry,
  type BackupManifest,
  type LocalFile,
} from './lib/backup-plan.ts'
import { MIME_BY_FORMAT, readImageInfo } from './lib/image-info.ts'
import {
  BUCKETS,
  connect,
  listBucket,
  publicObjectUrl,
  readImageReferences,
  type StorageObject,
} from './lib/supabase-script.ts'
import { formatBytes } from './lib/util.ts'

const ROOT = path.join('backups', 'images')
const MANIFEST = path.join(ROOT, 'manifest.json')
const apply = process.argv.includes('--apply')
const verifyOnly = process.argv.includes('--verify')
const restore = process.argv.includes('--restore')

function localPath(bucket: string, objectPath: string): string {
  if (objectPath.split('/').some((part) => part === '..' || part === '')) {
    throw new Error(`Refusing unsafe object path: ${bucket}/${objectPath}`)
  }
  return path.join(ROOT, bucket, ...objectPath.split('/'))
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function readManifest(): Promise<BackupManifest | null> {
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf8')) as BackupManifest
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

async function saveManifest(manifest: BackupManifest): Promise<void> {
  await mkdir(ROOT, { recursive: true })
  await writeFile(`${MANIFEST}.part`, JSON.stringify(manifest, null, 2) + '\n')
  await rename(`${MANIFEST}.part`, MANIFEST)
}

async function hashLocal(bucket: string, objectPath: string): Promise<LocalFile | null> {
  try {
    const bytes = await readFile(localPath(bucket, objectPath))
    return { bytes: bytes.byteLength, sha256: sha256(bytes) }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

async function verifyLocal(): Promise<void> {
  const manifest = await readManifest()
  if (!manifest) throw new Error(`No ${MANIFEST} yet. Run the backup first.`)
  let bad = 0
  let bytes = 0
  for (const entry of manifest.entries) {
    const local = await hashLocal(entry.bucket, entry.path)
    if (!local) console.log(`MISSING   ${entry.bucket}/${entry.path}`)
    else if (local.sha256 !== entry.sha256 || local.bytes !== entry.bytes) {
      console.log(`MISMATCH  ${entry.bucket}/${entry.path}`)
    } else {
      bytes += local.bytes
      continue
    }
    bad++
  }
  console.log(
    `${manifest.entries.length - bad}/${manifest.entries.length} files verified (${formatBytes(bytes)}).`,
  )
  if (bad > 0) process.exitCode = 1
}

async function download(url: string, bucket: string, object: StorageObject): Promise<Uint8Array> {
  const res = await fetch(publicObjectUrl(url, bucket, object.path), {
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`GET ${bucket}/${object.path} → HTTP ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes.byteLength !== object.bytes) {
    throw new Error(`${bucket}/${object.path}: got ${bytes.byteLength} B, listed ${object.bytes} B`)
  }
  // Single-part uploads have the MD5 as their ETag; check it when it looks like one.
  if (object.etag && /^[0-9a-f]{32}$/.test(object.etag)) {
    const md5 = createHash('md5').update(bytes).digest('hex')
    if (md5 !== object.etag)
      throw new Error(`${bucket}/${object.path}: MD5 ${md5} ≠ ETag ${object.etag}`)
  }
  return bytes
}

async function backup(): Promise<void> {
  const { client, url, mode } = await connect()
  console.log(`Connected (${mode}).`)

  const objectsByBucket: Record<string, StorageObject[]> = {}
  const localFiles = new Map<string, LocalFile>()
  for (const bucket of BUCKETS) {
    objectsByBucket[bucket] = await listBucket(client, bucket)
    for (const object of objectsByBucket[bucket]) {
      const local = await hashLocal(bucket, object.path)
      if (local) localFiles.set(entryKey(bucket, object.path), local)
    }
  }

  let manifest = await readManifest()
  const plan = planBackup(objectsByBucket, manifest, localFiles)
  for (const bucket of BUCKETS) {
    const objects = objectsByBucket[bucket]
    const total = objects.reduce((sum, object) => sum + object.bytes, 0)
    const pending = plan.download.filter((item) => item.bucket === bucket)
    const pendingBytes = pending.reduce((sum, item) => sum + item.object.bytes, 0)
    console.log(
      `${bucket}: ${objects.length} objects (${formatBytes(total)}); ` +
        `${objects.length - pending.length} up to date, ${pending.length} to download (${formatBytes(pendingBytes)})`,
    )
  }
  for (const entry of plan.goneFromBucket) {
    console.log(`kept      ${entry.bucket}/${entry.path} (no longer in the bucket)`)
  }
  const reasons = new Map<string, number>()
  for (const item of plan.download) reasons.set(item.reason, (reasons.get(item.reason) ?? 0) + 1)
  for (const [reason, count] of reasons) console.log(`  ${reason}: ${count}`)
  console.log(
    `To download: ${plan.download.length} files, ${formatBytes(plan.downloadBytes)} of egress.`,
  )

  if (plan.download.length === 0) return
  if (!apply) {
    console.log('Dry run. Re-run with `npm run images:backup -- --apply` to download.')
    return
  }

  manifest ??= { version: 1, updatedAt: new Date().toISOString(), entries: [] }
  let done = 0
  for (const { bucket, object } of plan.download) {
    const bytes = await download(url, bucket, object)
    const target = localPath(bucket, object.path)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(`${target}.part`, bytes)
    await rename(`${target}.part`, target)

    const info = readImageInfo(bytes)
    const now = new Date().toISOString()
    manifest = upsertEntry(
      manifest,
      {
        bucket,
        path: object.path,
        bytes: bytes.byteLength,
        sha256: sha256(bytes),
        etag: object.etag,
        type: info.format ? MIME_BY_FORMAT[info.format] : null,
        width: info.width,
        height: info.height,
        downloadedAt: now,
      },
      now,
    )
    await saveManifest(manifest)
    done++
    console.log(
      `[${done}/${plan.download.length}] ${bucket}/${object.path} (${formatBytes(bytes.byteLength)})`,
    )
  }
  console.log(`Done. Manifest: ${MANIFEST}`)
}

async function restoreMissing(): Promise<void> {
  const { client, mode } = await connect()
  console.log(`Connected (${mode}).`)
  const inBucket = new Set<string>()
  for (const bucket of BUCKETS) {
    for (const object of await listBucket(client, bucket))
      inBucket.add(entryKey(bucket, object.path))
  }
  const plan = planRestore(await readImageReferences(client), inBucket, await readManifest())
  console.log(`${plan.present} referenced files are in Storage (left alone).`)
  for (const { bucket, path: objectPath } of plan.lost) {
    console.log(`LOST      ${bucket}/${objectPath} (missing from Storage and from the backup)`)
  }
  for (const entry of plan.upload) console.log(`restore   ${entry.bucket}/${entry.path}`)
  const bytes = plan.upload.reduce((sum, entry) => sum + entry.bytes, 0)
  console.log(`To upload: ${plan.upload.length} files, ${formatBytes(bytes)}.`)
  if (plan.lost.length > 0) process.exitCode = 1
  if (plan.upload.length === 0) return
  if (!apply) {
    console.log('Dry run. Re-run with `npm run images:backup -- --restore --apply` to upload.')
    return
  }

  let done = 0
  for (const entry of plan.upload) {
    const bytes = await readFile(localPath(entry.bucket, entry.path))
    if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) {
      throw new Error(`${entry.bucket}/${entry.path}: local copy doesn't match the manifest`)
    }
    const { error } = await client.storage.from(entry.bucket).upload(entry.path, bytes, {
      contentType: entry.type ?? undefined,
      // Same as every upload since Phase 36: paths are never reused.
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) throw new Error(`upload ${entry.bucket}/${entry.path}: ${error.message}`)
    done++
    console.log(`[${done}/${plan.upload.length}] ${entry.bucket}/${entry.path}`)
  }
  console.log('Done. Check with `npm run images:audit` and `npm run verify:prod`.')
}

try {
  if (verifyOnly) await verifyLocal()
  else if (restore) await restoreMissing()
  else await backup()
} catch (error) {
  console.error(`✖ ${(error as Error).message}`)
  process.exitCode = 1
}

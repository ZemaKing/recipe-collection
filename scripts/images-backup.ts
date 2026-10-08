// Phase 34: `npm run images:backup` — local, checksummed copy of both buckets.
//
//   npm run images:backup                 dry run: what would be downloaded, and how many bytes
//   npm run images:backup -- --apply      download it (counts against the org's shared egress)
//   npm run images:backup -- --verify     offline: re-hash every local file against the manifest
//
// Files go to backups/images/{bucket}/{path} (git-ignored), with
// backups/images/manifest.json holding bytes, sha256, ETag, sniffed type and
// pixel size per object. The manifest is saved after every file, so an
// interrupted run resumes where it stopped; objects whose local copy still
// matches are skipped. Nothing in Storage is ever written or deleted, and a
// local copy is never deleted, even when its object is gone from the bucket.

import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  entryKey,
  planBackup,
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
  type StorageObject,
} from './lib/supabase-script.ts'
import { formatBytes } from './lib/util.ts'

const ROOT = path.join('backups', 'images')
const MANIFEST = path.join(ROOT, 'manifest.json')
const apply = process.argv.includes('--apply')
const verifyOnly = process.argv.includes('--verify')

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

try {
  if (verifyOnly) await verifyLocal()
  else await backup()
} catch (error) {
  console.error(`✖ ${(error as Error).message}`)
  process.exitCode = 1
}

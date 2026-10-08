// The batch converter: for every source, read the original once (local copy or download), convert it to each variant,
// upload, record it in the manifest. Resumable (sources already in the manifest — and still in
// Storage — are skipped), with retries on every network call, and a dry run that does everything
// except touch Storage (so it also measures the total size up front).
import { readFile } from 'node:fs/promises'

import {
  convertVariant,
  OUTPUT_CONTENT_TYPE,
  OUTPUT_EXT,
  readImageInfo,
  sha256,
  variantSettings,
} from './convert.ts'
import { isDone, type Manifest } from './manifest.ts'
import { renderPath } from './paths.ts'
import { errorMessage, HttpError, PermanentError, withRetry } from './retry.ts'
import type { ImageJob, ImageSource, StorageTarget, Variant } from './types.ts'

export const DEFAULTS = { cacheControl: '604800', concurrency: 4, retries: 4, timeoutMs: 30_000 }

export type BatchOptions = {
  apply: boolean // false = dry run: download + convert, never upload or write the manifest
  force?: boolean // redo sources the manifest says are done
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  log?: (line: string) => void
  persist?: (manifest: Manifest) => void // called after every uploaded source
}

export type OutputInfo = {
  path: string
  variant: string
  bytes: number
  width: number
  height: number
}
export type SourceResult = {
  key: string
  status: 'uploaded' | 'planned' | 'skipped' | 'failed'
  error?: string
  sourceBytes?: number
  downloaded?: boolean // the original came over the network rather than from a local file
  outputs: OutputInfo[]
}
export type BatchSummary = {
  results: SourceResult[]
  counts: Record<SourceResult['status'], number>
  sourceBytes: number // originals read in this run (from disk or downloaded)
  downloadedBytes: number // the part of sourceBytes that was downloaded (egress)
  outputBytes: number // every output of the job (skipped ones counted from the manifest)
  byVariant: Record<string, { count: number; bytes: number }>
}

export function plannedPaths(
  job: ImageJob,
  source: ImageSource,
): { variant: Variant; path: string }[] {
  return job.variants.map((variant) => ({
    variant,
    path: renderPath(variant.pathPattern ?? job.pathPattern, {
      ...source.vars,
      variant: variant.name,
      ext: OUTPUT_EXT,
    }),
  }))
}

// Fails fast on duplicate keys or two sources mapping to the same storage path.
export function checkSources(job: ImageJob, sources: ImageSource[]): void {
  const keys = new Set<string>()
  const paths = new Map<string, string>()
  for (const source of sources) {
    if (keys.has(source.key)) throw new Error(`Duplicate source key "${source.key}".`)
    keys.add(source.key)
    for (const { path } of plannedPaths(job, source)) {
      const other = paths.get(path)
      if (other) throw new Error(`Sources "${other}" and "${source.key}" both map to ${path}.`)
      paths.set(path, source.key)
    }
  }
}

export async function download(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = DEFAULTS.timeoutMs,
): Promise<Buffer> {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!response.ok) throw new HttpError(response.status, `GET ${url} → HTTP ${response.status}`)
  const type = response.headers.get('content-type') ?? ''
  if (!type.startsWith('image/'))
    throw new PermanentError(`GET ${url} → ${type || 'no content-type'}, not an image`)
  const body = Buffer.from(await response.arrayBuffer())
  const declared = Number(response.headers.get('content-length'))
  if (!response.headers.get('content-encoding') && declared > 0 && body.length !== declared) {
    throw new Error(`GET ${url} → truncated (${body.length} of ${declared} bytes)`) // retried
  }
  return body
}

// The original's bytes: the local copy when the source has one (no egress), else a download.
export async function readSource(
  source: ImageSource,
  fetchImpl: typeof fetch = fetch,
): Promise<{ data: Buffer; downloaded: boolean }> {
  if (!source.file) return { data: await download(source.url, fetchImpl), downloaded: true }
  let data: Buffer
  try {
    data = await readFile(source.file)
  } catch (error) {
    throw new PermanentError(`Can't read ${source.file} (${errorMessage(error)}).`)
  }
  if (source.sha256 && sha256(data) !== source.sha256) {
    throw new PermanentError(`${source.file}: sha256 differs from the expected one.`)
  }
  return { data, downloaded: false }
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

export const formatBytes = (bytes: number): string =>
  bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`

export async function runBatch(
  job: ImageJob,
  sources: ImageSource[],
  target: StorageTarget,
  manifest: Manifest,
  options: BatchOptions,
): Promise<BatchSummary> {
  checkSources(job, sources)
  const { apply, force = false, fetchImpl = fetch, sleep, log = () => {}, persist } = options
  const retries = job.retries ?? DEFAULTS.retries
  const cacheControl = job.cacheControl ?? DEFAULTS.cacheControl
  const retry = <T>(label: string, fn: () => Promise<T>) =>
    withRetry(fn, {
      retries,
      sleep,
      onRetry: (attempt, error, delay) =>
        log(`  ↻ ${label}: ${errorMessage(error)} — retry ${attempt}/${retries} in ${delay} ms`),
    })

  const processSource = async (source: ImageSource): Promise<SourceResult> => {
    const planned = plannedPaths(job, source)
    const fromManifest = (): OutputInfo[] =>
      planned.map(({ path, variant }) => {
        const e = manifest.objects[path]
        return { path, variant: variant.name, bytes: e.bytes, width: e.width, height: e.height }
      })

    try {
      // A variant is done when the manifest has it with the same source and settings and, in a
      // real run, Storage still has it at the recorded size. Done variants aren't redone (so adding
      // a variant to a job uploads just that one) unless --force.
      const done = new Set<string>()
      if (!force) {
        await Promise.all(
          planned.map(async ({ path, variant }) => {
            if (!isDone(manifest, path, source, variant)) return
            const stat = apply ? await retry(`stat ${path}`, () => target.stat(path)) : null
            if (!apply || stat?.size === manifest.objects[path].bytes) done.add(path)
          }),
        )
      }
      if (done.size === planned.length) {
        return { key: source.key, status: 'skipped', outputs: fromManifest() }
      }

      const { data: original, downloaded } = await retry(`read ${source.key}`, () =>
        readSource(source, fetchImpl),
      )
      const info = await readImageInfo(original)
      const sourceSha256 = sha256(original)
      const outputs: OutputInfo[] = []
      for (const { path, variant } of planned) {
        if (done.has(path)) {
          const e = manifest.objects[path]
          outputs.push({
            path,
            variant: variant.name,
            bytes: e.bytes,
            width: e.width,
            height: e.height,
          })
          continue
        }
        const out = await convertVariant(original, variant)
        if (apply) {
          await retry(`upload ${path}`, () =>
            target.upload(path, out.data, { contentType: OUTPUT_CONTENT_TYPE, cacheControl }),
          )
          const stat = await retry(`stat ${path}`, () => target.stat(path))
          if (stat?.size !== out.bytes)
            throw new Error(
              `${path}: Storage reports ${stat?.size ?? 'no object'}, uploaded ${out.bytes} bytes`,
            )
          manifest.objects[path] = {
            source: source.key,
            sourceUrl: source.url,
            sourceSha256,
            sourceBytes: original.length,
            sourceWidth: info.width,
            sourceHeight: info.height,
            variant: variant.name,
            settings: variantSettings(variant),
            contentType: OUTPUT_CONTENT_TYPE,
            sha256: out.sha256,
            bytes: out.bytes,
            width: out.width,
            height: out.height,
            uploadedAt: new Date().toISOString(),
          }
        }
        outputs.push({
          path,
          variant: variant.name,
          bytes: out.bytes,
          width: out.width,
          height: out.height,
        })
      }
      if (apply) persist?.(manifest)
      return {
        key: source.key,
        status: apply ? 'uploaded' : 'planned',
        sourceBytes: original.length,
        downloaded,
        outputs,
      }
    } catch (error) {
      return { key: source.key, status: 'failed', error: errorMessage(error), outputs: [] }
    }
  }

  const results = await mapPool(
    sources,
    job.concurrency ?? DEFAULTS.concurrency,
    async (source, index) => {
      const result = await processSource(source)
      const n = `[${String(index + 1).padStart(String(sources.length).length)}/${sources.length}]`
      if (result.status === 'failed') log(`${n} ✖ ${source.key}: ${result.error}`)
      else {
        const outs = result.outputs
          .map((o) => `${o.variant} ${o.width}×${o.height} ${formatBytes(o.bytes)}`)
          .join(' · ')
        const icon = { uploaded: '✓', planned: '○', skipped: '=', failed: '' }[result.status]
        const from = result.sourceBytes ? `${formatBytes(result.sourceBytes)} → ` : ''
        log(`${n} ${icon} ${source.key}  ${from}${outs}`)
      }
      return result
    },
  )

  const counts = { uploaded: 0, planned: 0, skipped: 0, failed: 0 }
  const byVariant: BatchSummary['byVariant'] = {}
  let sourceBytes = 0
  let downloadedBytes = 0
  let outputBytes = 0
  for (const r of results) {
    counts[r.status]++
    sourceBytes += r.sourceBytes ?? 0
    if (r.downloaded) downloadedBytes += r.sourceBytes ?? 0
    for (const o of r.outputs) {
      outputBytes += o.bytes
      byVariant[o.variant] ??= { count: 0, bytes: 0 }
      byVariant[o.variant].count++
      byVariant[o.variant].bytes += o.bytes
    }
  }
  return { results, counts, sourceBytes, downloadedBytes, outputBytes, byVariant }
}

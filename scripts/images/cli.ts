// Generic CLI for one or more ImageJobs (see README.md):
//
//   node scripts/images/cli.ts <job.ts> [<job2.ts> …] upload [--dry-run] [--apply] [--force] [--only=k1,k2] [--limit=N]
//   node scripts/images/cli.ts <job.ts> [<job2.ts> …] verify [--full]
//
// Jobs run one after the other; --limit applies to each job. Connects with the service-role key or
// the admin login (scripts/lib/supabase-script.ts, reads .env.local itself).
//
// upload: dry run by default (read + convert + size report, nothing uploaded); --apply uploads
// and writes the manifest after every source, so an interrupted run just resumes.
// verify: every manifest object's public URL answers 200 with the right type/size; --full also
// downloads each one and compares sha256 + dimensions.
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { DEFAULTS, formatBytes, runBatch } from './batch.ts'
import { loadManifest, saveManifest } from './manifest.ts'
import { connect } from '../lib/supabase-script.ts'
import { checkBucket, supabaseTarget } from './supabase-target.ts'
import type { ImageJob } from './types.ts'
import { verifyObjects } from './verify.ts'

export type CliArgs = {
  jobPaths: string[]
  command: 'upload' | 'verify'
  apply: boolean
  force: boolean
  full: boolean
  only: string[] | null
  limit: number | null
}

export function parseArgs(argv: string[]): CliArgs {
  const positional = argv.filter((a) => !a.startsWith('--'))
  const flags = new Map(
    argv
      .filter((a) => a.startsWith('--'))
      .map((a) => {
        const [name, value = ''] = a.slice(2).split('=')
        return [name, value] as const
      }),
  )
  const known = new Set(['apply', 'dry-run', 'force', 'full', 'only', 'limit'])
  const unknown = [...flags.keys()].filter((f) => !known.has(f))
  if (unknown.length) throw new Error(`Unknown flag(s): ${unknown.map((f) => `--${f}`).join(', ')}`)

  const jobPaths = positional.filter((a) => /\.[cm]?[jt]s$/.test(a))
  const [command = 'upload', ...extra] = positional.filter((a) => !jobPaths.includes(a))
  if (!jobPaths.length)
    throw new Error('Usage: cli.ts <job.ts> [<job2.ts> …] [upload|verify] [flags]')
  if (extra.length) throw new Error(`Unexpected argument(s): ${extra.join(', ')}`)
  if (command !== 'upload' && command !== 'verify')
    throw new Error(`Unknown command "${command}" (upload | verify).`)
  if (flags.has('apply') && flags.has('dry-run'))
    throw new Error('--apply and --dry-run are mutually exclusive.')
  const limit = flags.has('limit') ? Number(flags.get('limit')) : null
  if (limit !== null && !(Number.isInteger(limit) && limit > 0))
    throw new Error('--limit needs a positive integer.')
  const only =
    flags
      .get('only')
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? null
  return {
    jobPaths,
    command,
    apply: flags.has('apply'),
    force: flags.has('force'),
    full: flags.has('full'),
    only,
    limit,
  }
}

export async function loadJob(jobPath: string): Promise<ImageJob> {
  const job = (await import(pathToFileURL(resolve(jobPath)).href)).default as ImageJob | undefined
  if (
    !job?.bucket ||
    !job.pathPattern ||
    !job.variants?.length ||
    !job.manifest ||
    typeof job.sources !== 'function'
  ) {
    throw new Error(
      `${jobPath} must default-export an ImageJob (bucket, pathPattern, variants, manifest, sources).`,
    )
  }
  return job
}

type Supabase = Awaited<ReturnType<typeof connect>>['client']

async function verifyJob(job: ImageJob, supabase: Supabase, full: boolean): Promise<boolean> {
  const target = supabaseTarget(supabase, job.bucket)
  const manifest = loadManifest(job.manifest, job.name, job.bucket)
  const mode = full ? 'full' : 'head'
  const objects = Object.keys(manifest.objects).length
  if (!objects) {
    console.error(`✖ ${job.name}: the manifest is empty — nothing has been uploaded yet.`)
    return false
  }
  console.log(
    `Verifying ${objects} object(s) of "${job.name}" (${mode === 'full' ? 'download + sha256 + dimensions' : 'HEAD'})…`,
  )
  const results = await verifyObjects(manifest.objects, {
    mode,
    publicUrl: target.publicUrl,
    retries: job.retries,
  })
  const failed = results.filter((r) => !r.ok)
  for (const r of failed) console.log(`  ✖ ${r.path}: ${r.problem}`)
  console.log(`${results.length - failed.length}/${results.length} objects OK\n`)
  return !failed.length
}

type JobTotals = {
  failed: number
  sourceBytes: number
  downloadedBytes: number
  outputBytes: number
}

async function uploadJob(job: ImageJob, supabase: Supabase, args: CliArgs): Promise<JobTotals> {
  const target = supabaseTarget(supabase, job.bucket)
  const manifest = loadManifest(job.manifest, job.name, job.bucket)
  let sources = await job.sources(supabase)
  if (args.only) {
    const wanted = new Set(args.only)
    sources = sources.filter((s) => wanted.has(s.key))
  }
  if (args.limit) sources = sources.slice(0, args.limit)
  if (args.apply && sources.length) await checkBucket(supabase, job.bucket)

  const variants = job.variants
    .map((v) => `${v.name} ≤${v.maxWidth}×${v.maxHeight ?? v.maxWidth} q${v.quality}`)
    .join(', ')
  const local = sources.filter((s) => s.file).length
  console.log(
    `${args.apply ? 'UPLOADING' : 'DRY RUN (nothing is uploaded)'} — ${job.name}: ${sources.length} source(s) → bucket "${job.bucket}"`,
  )
  console.log(
    `  ${job.pathPattern} · webp: ${variants} · concurrency ${job.concurrency ?? DEFAULTS.concurrency} · retries ${job.retries ?? DEFAULTS.retries}${args.force ? ' · --force' : ''}`,
  )
  console.log(`  originals: ${local} from local files, ${sources.length - local} by download\n`)

  const summary = await runBatch(job, sources, target, manifest, {
    apply: args.apply,
    force: args.force,
    log: (line) => console.log(line),
    persist: (m) => saveManifest(job.manifest, m),
  })

  const { counts, byVariant } = summary
  console.log(
    `\n${args.apply ? 'Uploaded' : 'Would upload'} ${args.apply ? counts.uploaded : counts.planned} · skipped (already done) ${counts.skipped} · failed ${counts.failed}`,
  )
  if (summary.sourceBytes) {
    console.log(
      `Originals read: ${formatBytes(summary.sourceBytes)} (downloaded: ${formatBytes(summary.downloadedBytes)})`,
    )
  }
  for (const [name, v] of Object.entries(byVariant)) {
    console.log(
      `  ${name.padEnd(8)} ${String(v.count).padStart(5)} files  ${formatBytes(v.bytes).padStart(10)}  (avg ${formatBytes(v.bytes / v.count)})`,
    )
  }
  console.log(
    `  total    ${String(Object.values(byVariant).reduce((n, v) => n + v.count, 0)).padStart(5)} files  ${formatBytes(summary.outputBytes).padStart(10)}\n`,
  )
  return {
    failed: counts.failed,
    sourceBytes: summary.sourceBytes,
    downloadedBytes: summary.downloadedBytes,
    outputBytes: summary.outputBytes,
  }
}

async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv)
  const jobs = await Promise.all(args.jobPaths.map(loadJob))
  const { client: supabase, mode } = await connect()
  console.log(`Connected as ${mode}.\n`)

  if (args.command === 'verify') {
    let ok = true
    for (const job of jobs) ok = (await verifyJob(job, supabase, args.full)) && ok
    return ok ? 0 : 1
  }

  if (args.only) {
    const keys = new Set(
      (await Promise.all(jobs.map((j) => j.sources(supabase)))).flat().map((s) => s.key),
    )
    const missing = args.only.filter((k) => !keys.has(k))
    if (missing.length) throw new Error(`--only: unknown source key(s) ${missing.join(', ')}`)
  }

  const totals: JobTotals = { failed: 0, sourceBytes: 0, downloadedBytes: 0, outputBytes: 0 }
  for (const job of jobs) {
    const t = await uploadJob(job, supabase, args)
    for (const k of Object.keys(totals) as (keyof JobTotals)[]) totals[k] += t[k]
  }
  if (jobs.length > 1 && totals.sourceBytes) {
    const saved = 1 - totals.outputBytes / totals.sourceBytes
    console.log(
      `All jobs: originals ${formatBytes(totals.sourceBytes)} → WebP ${formatBytes(totals.outputBytes)} (−${(saved * 100).toFixed(0)} %), downloaded ${formatBytes(totals.downloadedBytes)}`,
    )
  }
  if (totals.failed) {
    console.log(
      `\n✖ ${totals.failed} source(s) failed. Re-run the same command to retry just those — finished ones are skipped.`,
    )
    return 1
  }
  if (!args.apply) console.log('\nNothing was uploaded. Re-run with --apply to upload.')
  return 0
}

// Only when run directly (tests import parseArgs).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(`✖ ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    },
  )
}

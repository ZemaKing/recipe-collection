// Phase 34: `npm run images:audit` — rows vs objects for both buckets, bytes
// by format, orphans, duplicates. Writes docs/images-audit.md.
//
// Read-only. Lists the buckets (needs the service-role key or the admin login,
// see scripts/lib/supabase-script.ts), reads recipe_images / ingredients, and
// sends one HEAD per public URL. Never downloads an image body.

import { mkdir, writeFile } from 'node:fs/promises'
import { auditBucket, headKey, renderAuditMarkdown, type HeadResult } from './lib/image-audit.ts'
import {
  BUCKETS,
  connect,
  listBucket,
  publicObjectUrl,
  readImageReferences,
} from './lib/supabase-script.ts'
import { formatBytes, mapPool } from './lib/util.ts'

const OUTPUT = 'docs/images-audit.md'

// Storage answers 429 to bursts of HEADs (e.g. right after an images:* run),
// so back off and retry those a few times before reporting them.
async function head(url: string): Promise<HeadResult> {
  let res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(30_000) })
  for (let attempt = 1; res.status === 429 && attempt <= 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt))
    res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(30_000) })
  }
  const length = res.headers.get('content-length')
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    bytes: length === null ? null : Number(length),
    etag: res.headers.get('etag')?.replaceAll('"', '') ?? null,
  }
}

const { client, url, mode } = await connect()
console.log(`Connected (${mode}).`)

const refs = await readImageReferences(client)
const audits = []
for (const bucket of BUCKETS) {
  const objects = await listBucket(client, bucket)
  const results = await mapPool(objects, 8, async (object) => {
    const result = await head(publicObjectUrl(url, bucket, object.path))
    return [headKey(bucket, object.path), result] as const
  })
  const audit = auditBucket(bucket, refs, objects, new Map(results))
  audits.push(audit)
  console.log(
    `${bucket}: ${audit.rows} rows, ${audit.objects} objects, ${formatBytes(audit.bytes)}; ` +
      `missing ${audit.missing.length}, orphans ${audit.orphans.length}, shared ${audit.sharedPaths.length}, ` +
      `duplicates ${audit.duplicates.length}, HEAD problems ${audit.headProblems.length}`,
  )
}

await mkdir('docs', { recursive: true })
await writeFile(
  OUTPUT,
  renderAuditMarkdown(audits, { generatedAt: new Date().toISOString(), mode }),
)
console.log(`Wrote ${OUTPUT}.`)

const problems = audits.reduce(
  (sum, audit) => sum + audit.missing.length + audit.headProblems.length,
  0,
)
if (problems > 0) process.exitCode = 1

// Phase 43: read-only release check of production, as an anonymous visitor.
//
//   npm run verify:prod                          # Supabase side only
//   npm run verify:prod -- --url https://…       # + the deployed site (production or a preview)
//
// Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env.local):
//   - sign-ups are off (/auth/v1/settings → disable_signup)
//   - admin_users can't be read and neither bucket can be listed
//   - every recipe photo, card thumb and ingredient photo the rows point at is a .webp that
//     serves 200 image/webp (one HEAD each, no image bodies)
// Site (--url):
//   - vercel.json's security headers + CSP are served as committed
//   - every inline <script> in the served index.html is allowed by its sha256
//   - /assets/* is cached immutable; a deep link (/en/recepti) gets index.html
//   - no Supabase secret in what visitors download (check-bundle-secrets.mjs --url)
//
// Writes nothing. Write permissions are verify:rls's job (it needs the logins and
// creates throw-away fixtures). A Vercel preview URL behind Deployment Protection answers
// 302/401: test production, or turn protection off / use a share link for the preview.

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

try {
  process.loadEnvFile('.env.local')
} catch {
  // Fall back to the real environment.
}

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '')
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim()
if (!supabaseUrl || !anonKey) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (.env.local).')
  process.exit(1)
}

const urlFlag = process.argv.indexOf('--url')
const siteUrl = urlFlag === -1 ? null : process.argv[urlFlag + 1]?.replace(/\/+$/, '')
if (urlFlag !== -1 && !siteUrl) {
  console.error('Usage: npm run verify:prod -- --url https://your-site')
  process.exit(1)
}

let passes = 0
let failures = 0
function check(ok, label, detail = '') {
  if (ok) passes++
  else failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`)
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// --- Supabase ---------------------------------------------------------------

const settings = await fetch(`${supabaseUrl}/auth/v1/settings`, {
  headers: { apikey: anonKey },
}).then((res) => res.json())
check(
  settings.disable_signup === true,
  'sign-ups are off',
  `disable_signup: ${settings.disable_signup}`,
)

{
  const { data, error } = await supabase.from('admin_users').select('user_id').limit(1)
  check(Boolean(error) || data.length === 0, 'anon cannot read admin_users', `${data?.length} rows`)
}

for (const bucket of ['recipe-images', 'ingredient-images']) {
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 5 })
  check(
    Boolean(error) || data.length === 0,
    `anon cannot list ${bucket}`,
    `${data?.length} entries`,
  )
}

const { data: images, error: imagesError } = await supabase
  .from('recipe_images')
  .select('storage_path, thumb_path')
const { data: ingredients, error: ingredientsError } = await supabase
  .from('ingredients')
  .select('image_storage_path')
  .not('image_storage_path', 'is', null)
if (imagesError || ingredientsError) {
  check(false, 'read image rows', (imagesError ?? ingredientsError).message)
} else {
  const paths = [
    ...images.flatMap((row) => [
      ['recipe-images', row.storage_path, 'full'],
      ['recipe-images', row.thumb_path, 'thumb'],
    ]),
    ...ingredients.map((row) => ['ingredient-images', row.image_storage_path, 'ingredient']),
  ]
  const missingThumbs = paths.filter(([, path]) => !path)
  check(
    missingThumbs.length === 0,
    `every recipe photo has a card thumb`,
    `${missingThumbs.length} without`,
  )

  const present = paths.filter(([, path]) => path)
  const notWebp = present.filter(([, path]) => !path.endsWith('.webp'))
  check(
    notWebp.length === 0,
    `${present.length} image paths are .webp`,
    notWebp
      .map(([, p]) => p)
      .slice(0, 5)
      .join(', '),
  )

  const problems = []
  let next = 0
  async function worker() {
    while (next < present.length) {
      const [bucket, path] = present[next++]
      const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`
      let res = await fetch(url, { method: 'HEAD' })
      // Storage answers 429 to bursts of HEADs: back off and retry (as images:audit does).
      for (let attempt = 1; res.status === 429 && attempt <= 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
        res = await fetch(url, { method: 'HEAD' })
      }
      const type = res.headers.get('content-type')
      if (res.status !== 200 || type !== 'image/webp')
        problems.push(`${path}: ${res.status} ${type}`)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  check(
    problems.length === 0,
    `${present.length} images serve 200 image/webp`,
    problems.slice(0, 5).join('; '),
  )
}

// --- Site -------------------------------------------------------------------

if (siteUrl) {
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  const expected = vercel.headers.find((rule) => rule.source === '/(.*)').headers

  const page = await fetch(`${siteUrl}/sr`, { redirect: 'manual' })
  check(
    page.status === 200,
    `GET ${siteUrl}/sr → 200`,
    `HTTP ${page.status}${page.status >= 300 && page.status < 400 ? ' (Deployment Protection?)' : ''}`,
  )
  if (page.status === 200) {
    for (const { key, value } of expected) {
      const served = page.headers.get(key)
      check(served === value, `header ${key}`, served === null ? 'missing' : `served: ${served}`)
    }

    const html = await page.text()
    const csp = page.headers.get('content-security-policy') ?? ''
    const scriptSrc = csp.match(/script-src([^;]*)/)?.[1] ?? ''
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    for (const [, body] of inline) {
      const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`
      check(
        scriptSrc.includes(hash),
        `inline script allowed by the CSP`,
        `${hash} not in script-src`,
      )
    }

    const asset = html.match(/\/assets\/[\w.-]+\.js/)?.[0]
    if (new URL(siteUrl).hostname === 'localhost') {
      // `npm run preview` sends only the "/(.*)" headers; the /assets rule is Vercel's.
      console.log('SKIP  /assets immutable caching (Vercel only, not npm run preview)')
    } else if (asset) {
      const res = await fetch(siteUrl + asset, { method: 'HEAD' })
      const cache = res.headers.get('cache-control') ?? ''
      check(
        res.ok && cache.includes('immutable'),
        `${asset} cached immutable`,
        `HTTP ${res.status}, ${cache}`,
      )
    } else {
      check(false, 'index.html references an /assets/*.js file')
    }

    const deep = await fetch(`${siteUrl}/en/recepti`)
    const deepHtml = await deep.text()
    check(
      deep.status === 200 && deepHtml.includes('<div id="root">'),
      'deep link /en/recepti serves the app',
      `HTTP ${deep.status}`,
    )

    const secrets = spawnSync(
      process.execPath,
      ['scripts/check-bundle-secrets.mjs', '--url', siteUrl],
      {
        encoding: 'utf8',
      },
    )
    check(
      secrets.status === 0,
      'no Supabase secrets in the deployed bundle',
      (secrets.stderr || secrets.stdout).trim(),
    )
  }
} else {
  console.log('SKIP  site checks (pass --url https://… to check the deployed headers and bundle)')
}

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)

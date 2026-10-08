// Fails the build if vercel.json's Content-Security-Policy no longer fits dist/index.html:
// every inline <script> must be allowed by its sha256 in script-src (or the CSP blocks it in
// production, e.g. the theme script: light-mode users would get a dark flash), and the Supabase
// origin index.html preconnects to must be in connect-src and img-src, and data: assets the CSS
// inlines must be allowed. Runs in postbuild.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const vercel = JSON.parse(read('vercel.json'))
const csp = vercel.headers
  .filter((rule) => rule.source === '/(.*)')
  .flatMap((rule) => rule.headers)
  .find((header) => header.key.toLowerCase() === 'content-security-policy')?.value

if (!csp) {
  console.error('✖ vercel.json has no Content-Security-Policy on "/(.*)"')
  process.exit(1)
}

const directives = new Map(
  csp
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .filter(([name]) => name)
    .map(([name, ...sources]) => [name, sources]),
)
const sourcesOf = (name) => directives.get(name) ?? directives.get('default-src') ?? []

const html = read('dist/index.html')
const problems = []

const scriptSrc = sourcesOf('script-src')
const inlineHashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
  ([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
)
for (const hash of inlineHashes) {
  if (!scriptSrc.includes(hash)) {
    problems.push(`an inline <script> in index.html isn't allowed: add ${hash} to script-src`)
  }
}
for (const source of scriptSrc.filter((s) => s.startsWith("'sha256-"))) {
  if (!inlineHashes.includes(source)) {
    problems.push(`script-src allows ${source}, which matches no inline script: remove it`)
  }
}

for (const [, origin] of html.matchAll(/<link rel="preconnect" href="([^"]+)"/g)) {
  for (const directive of ['connect-src', 'img-src']) {
    if (!sourcesOf(directive).includes(origin)) {
      problems.push(
        `${directive} is missing ${origin} (the Supabase URL index.html preconnects to)`,
      )
    }
  }
}

// Vite inlines small assets (< 4 kB, e.g. the latin-ext Inter subset) as data: URLs in the CSS.
const dataDirective = { font: 'font-src', image: 'img-src' }
for (const file of readdirSync(new URL('../dist/assets/', import.meta.url))) {
  if (!file.endsWith('.css')) continue
  for (const [, type] of read(`dist/assets/${file}`).matchAll(/url\(["']?data:(\w+)\//g)) {
    const directive = dataDirective[type]
    if (directive && !sourcesOf(directive).includes('data:')) {
      problems.push(`${file} inlines a data: ${type}: add data: to ${directive}`)
    }
  }
}

if (problems.length) {
  console.error('✖ vercel.json CSP vs dist/index.html:\n  ' + problems.join('\n  '))
  process.exit(1)
}

console.log(`✓ CSP fits dist/index.html (${inlineHashes.length} inline script(s) hashed)`)

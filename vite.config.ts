/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// vercel.json's CSP allows the inline theme script in index.html by its sha256. A Windows
// checkout (core.autocrlf) has CRLF line endings and Vercel's has LF, so normalise them: every
// build then serves the same bytes and one hash fits (checked after each build by
// scripts/check-csp.mjs).
const lfIndexHtml: Plugin = {
  name: 'lf-index-html',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replace(/\r\n?/g, '\n') },
}

// `npm run preview` sends production's headers (CSP included), so a local check of the built
// app sees what Vercel serves. The /assets cache rule is left to Vercel.
interface VercelConfig {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const vercel = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, 'vercel.json'), 'utf8'),
) as VercelConfig
const siteHeaders = Object.fromEntries(
  vercel.headers
    .filter((rule) => rule.source === '/(.*)')
    .flatMap((rule) => rule.headers.map(({ key, value }) => [key, value])),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), lfIndexHtml],
  preview: { headers: siteHeaders },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // The app never opens a Realtime channel (see src/lib/realtime-stub.ts, and its test
      // guarding the stub against supabase-js upgrades).
      '@supabase/realtime-js': path.resolve(import.meta.dirname, './src/lib/realtime-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})

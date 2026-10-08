// Recipe photos → WebP full + thumb (ROADMAP Phase 35/36, "Architecture target (images)").
// Run through the generic CLI: `npm run images:migrate` (both jobs) or
// `node scripts/images/cli.ts scripts/migrate-images/recipe-job.ts upload`.
import type { ImageJob } from '../images/types.ts'
import { readAllRows, RECIPE_BUCKET } from '../lib/supabase-script.ts'
import { loadBackupIndex, rowsToSources } from './sources.ts'

const job: ImageJob = {
  name: 'recipe photos',
  bucket: RECIPE_BUCKET,
  // {recipe_id}/{uuid}.png → {recipe_id}/{uuid}.webp + {recipe_id}/{uuid}.thumb.webp
  pathPattern: '{folder}/{name}.{ext}',
  variants: [
    // Originals are ≤ 1536 px wide, so full is a re-encode, not a resize.
    { name: 'full', maxWidth: 1600, quality: 85 },
    // Cards are aspect-square at ≤ ~300 CSS px; 600 covers 2× screens.
    { name: 'thumb', maxWidth: 600, quality: 85, pathPattern: '{folder}/{name}.thumb.{ext}' },
  ],
  manifest: new URL('./recipe-manifest.json', import.meta.url),
  // Every new image gets a new path, so objects can be cached for a year.
  cacheControl: '31536000',
  concurrency: 4,
  retries: 4,
  async sources(supabase) {
    // `*` so this also runs before the Phase 35 migration adds original_path.
    const rows = await readAllRows<{
      id: string
      storage_path: string
      original_path?: string | null
    }>(supabase, 'recipe_images')
    const publicUrl = (path: string) =>
      supabase.storage.from(RECIPE_BUCKET).getPublicUrl(path).data.publicUrl
    return rowsToSources(
      rows.map((row) => ({ id: row.id, path: row.original_path ?? row.storage_path })),
      RECIPE_BUCKET,
      publicUrl,
      loadBackupIndex(),
    )
  },
}

export default job

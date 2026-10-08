// Ingredient catalog photos → one WebP each, transparency kept (ROADMAP Phase 35/36).
// Run through the generic CLI: `npm run images:migrate` (both jobs) or
// `node scripts/images/cli.ts scripts/migrate-images/ingredient-job.ts upload`.
import type { ImageJob } from '../images/types.ts'
import { INGREDIENT_BUCKET, readAllRows } from '../lib/supabase-script.ts'
import { loadBackupIndex, rowsToSources } from './sources.ts'

const job: ImageJob = {
  name: 'ingredient photos',
  bucket: INGREDIENT_BUCKET,
  // {ingredient_id}/{uuid}.png → {ingredient_id}/{uuid}.webp
  pathPattern: '{folder}/{name}.{ext}',
  // Today's are all 300×200, so they keep their size; anything larger is fitted inside 600×400.
  variants: [{ name: 'full', maxWidth: 600, maxHeight: 400, quality: 85 }],
  manifest: new URL('./ingredient-manifest.json', import.meta.url),
  cacheControl: '31536000',
  concurrency: 4,
  retries: 4,
  async sources(supabase) {
    // `*` so this also runs before the Phase 35 migration adds image_original_path.
    const rows = await readAllRows<{
      id: string
      image_storage_path: string | null
      image_original_path?: string | null
    }>(supabase, 'ingredients')
    const publicUrl = (path: string) =>
      supabase.storage.from(INGREDIENT_BUCKET).getPublicUrl(path).data.publicUrl
    return rowsToSources(
      rows.flatMap((row) => {
        const path = row.image_original_path ?? row.image_storage_path
        return path ? [{ id: row.id, path }] : []
      }),
      INGREDIENT_BUCKET,
      publicUrl,
      loadBackupIndex(),
    )
  },
}

export default job

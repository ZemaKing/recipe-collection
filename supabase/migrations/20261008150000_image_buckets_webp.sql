-- Phase 38: uploads are converted to WebP in the browser (src/lib/storage.ts),
-- so both buckets now accept only WebP, plus PNG for browsers that can't
-- encode WebP (the canvas falls back to PNG). JPEG is no longer stored;
-- existing JPEG/PNG originals are unaffected (the limit applies to new
-- uploads) and are retired in Phase 39.
--
-- file_size_limit stays 5 MB: WebP outputs are ≈ 100–400 KB, but a PNG
-- fallback of a 1600 px photo can reach a few MB. Safe to re-run.

update storage.buckets
set allowed_mime_types = array['image/webp', 'image/png']
where id in ('recipe-images', 'ingredient-images');

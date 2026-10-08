-- Phase 35: Image Pipeline Port & Schema.
-- Columns for the WebP variants written by `npm run images:migrate` (Phase 36)
-- and, later, by the browser upload path (Phase 38). All nullable, so existing
-- rows and today's app are unaffected; nothing here changes a row.
--
--   recipe_images.storage_path   the full WebP (≤ 1600 px) once flipped
--   recipe_images.thumb_path     the thumbnail WebP (≤ 600 px); null → use storage_path
--   recipe_images.width/height   of the full image, for <img width height>
--   recipe_images.original_path  the pre-WebP object, kept for rollback until Phase 39
--
--   ingredients.image_width/height    of image_storage_path
--   ingredients.image_original_path   the pre-WebP object, kept until Phase 39
--
-- Safe to re-run.

begin;

alter table public.recipe_images
  add column if not exists thumb_path text,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists original_path text;

alter table public.ingredients
  add column if not exists image_width integer,
  add column if not exists image_height integer,
  add column if not exists image_original_path text;

-- Dimensions are known together or not at all, and are positive.
alter table public.recipe_images
  drop constraint if exists recipe_images_dimensions_check;
alter table public.recipe_images
  add constraint recipe_images_dimensions_check check (
    (width is null and height is null) or (width > 0 and height > 0)
  );

alter table public.ingredients
  drop constraint if exists ingredients_image_dimensions_check;
alter table public.ingredients
  add constraint ingredients_image_dimensions_check check (
    (image_width is null and image_height is null) or (image_width > 0 and image_height > 0)
  );

comment on column public.recipe_images.thumb_path is
  'Thumbnail WebP (fits 600×600) in recipe-images; null → list views fall back to storage_path.';
comment on column public.recipe_images.width is 'Width in px of the image at storage_path.';
comment on column public.recipe_images.height is 'Height in px of the image at storage_path.';
comment on column public.recipe_images.original_path is
  'Pre-WebP object kept for rollback (images:flip --rollback) until originals are retired.';
comment on column public.ingredients.image_width is 'Width in px of the image at image_storage_path.';
comment on column public.ingredients.image_height is 'Height in px of the image at image_storage_path.';
comment on column public.ingredients.image_original_path is
  'Pre-WebP object kept for rollback until originals are retired.';

commit;

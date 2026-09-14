-- Storage bucket for the single photo on each ingredient catalog entry.
-- Public read, authenticated-only write (same pattern as recipe-images).

insert into storage.buckets (id, name, public)
values ('ingredient-images', 'ingredient-images', true)
on conflict (id) do nothing;

drop policy if exists "ingredient_images_bucket_public_select" on storage.objects;
create policy "ingredient_images_bucket_public_select" on storage.objects
  for select using (bucket_id = 'ingredient-images');

drop policy if exists "ingredient_images_bucket_authenticated_write" on storage.objects;
create policy "ingredient_images_bucket_authenticated_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'ingredient-images')
  with check (bucket_id = 'ingredient-images');

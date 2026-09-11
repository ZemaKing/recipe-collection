-- Phase 11: Storage bucket for recipe photos.
-- Public read (anyone can view recipe photos), authenticated-only write.

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

drop policy if exists "recipe_images_bucket_public_select" on storage.objects;
create policy "recipe_images_bucket_public_select" on storage.objects
  for select using (bucket_id = 'recipe-images');

drop policy if exists "recipe_images_bucket_authenticated_write" on storage.objects;
create policy "recipe_images_bucket_authenticated_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'recipe-images')
  with check (bucket_id = 'recipe-images');

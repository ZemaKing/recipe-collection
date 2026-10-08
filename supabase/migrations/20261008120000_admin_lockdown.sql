-- Phase 33: Security & Privacy Lockdown.
-- Until now every write policy was `for all to authenticated using (true)`, so
-- any account that signed up could edit or delete everything. Writes now
-- require membership in admin_users (checked by is_admin()).
--
-- Public reads are unchanged: every table stays readable by anon, including
-- kitchen_notes and meal_plan_entries (Open decision 2: keep both public).
--
-- OWNER: before running, replace REPLACE_WITH_ADMIN_EMAIL below (in the SQL
-- editor only, not in git) with the email you sign in with. The script runs
-- in one transaction and aborts without changing anything if no auth user
-- has that email. Safe to re-run.

begin;

-- admin allow-list -------------------------------------------------------

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS on with no policies, and no API grants: only is_admin() (security
-- definer) and the dashboard can read it.
alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

do $$
declare
  admin_email constant text := 'REPLACE_WITH_ADMIN_EMAIL';
begin
  insert into public.admin_users (user_id)
  select id from auth.users where email = admin_email
  on conflict (user_id) do nothing;

  if not exists (select 1 from public.admin_users) then
    raise exception 'admin_users is empty: no auth user has email %', admin_email;
  end if;
end $$;

-- table write policies -----------------------------------------------------
-- `(select public.is_admin())` instead of a bare call lets Postgres evaluate
-- it once per statement rather than once per row.

do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'subcategories', 'tags',
    'recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_tags', 'recipe_images',
    'ingredient_categories', 'ingredients',
    'vitamins', 'minerals', 'ingredient_vitamins', 'ingredient_minerals',
    'kitchen_notes', 'meal_plan_entries'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_write', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using ((select public.is_admin())) with check ((select public.is_admin()))',
      t || '_admin_write', t
    );
  end loop;
end $$;

-- storage ----------------------------------------------------------------
-- Public buckets serve /object/public/... URLs without consulting RLS, so the
-- public SELECT policies only enabled listing every object. Dropped. The
-- admin keeps SELECT (via `for all`) because deleteRecipeImageFolder /
-- deleteIngredientImageFolder list a folder, and remove() needs it too.

drop policy if exists "recipe_images_bucket_public_select" on storage.objects;
drop policy if exists "recipe_images_bucket_authenticated_write" on storage.objects;
drop policy if exists "recipe_images_bucket_admin_all" on storage.objects;
create policy "recipe_images_bucket_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'recipe-images' and (select public.is_admin()))
  with check (bucket_id = 'recipe-images' and (select public.is_admin()));

drop policy if exists "ingredient_images_bucket_public_select" on storage.objects;
drop policy if exists "ingredient_images_bucket_authenticated_write" on storage.objects;
drop policy if exists "ingredient_images_bucket_admin_all" on storage.objects;
create policy "ingredient_images_bucket_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'ingredient-images' and (select public.is_admin()))
  with check (bucket_id = 'ingredient-images' and (select public.is_admin()));

-- Server-side copy of the client limits in src/lib/storage.ts
-- (MAX_RECIPE_IMAGE_BYTES, ACCEPTED_RECIPE_IMAGE_TYPES).
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('recipe-images', 'ingredient-images');

commit;

-- Phase 36: switch image rows to their WebP variants (and back) in one
-- transaction. Called by `npm run images:flip` (scripts/migrate-images/flip.ts).
--
-- Each function takes a JSON array of
--   { id, from_path, to_path, original_path, thumb_path?, width, height }
-- and, for every entry, sets the row's path to `to_path` (plus the other
-- columns) only if its current path is `from_path`. If any entry doesn't match
-- exactly one row, the function raises and nothing is changed. The same
-- function does the rollback (to_path = the original, the rest null).
--
-- security invoker: the caller's RLS applies, so only the admin (or the
-- service role) can change anything; the explicit check gives a clear error.
-- Safe to re-run.

begin;

create or replace function public.set_recipe_image_variants(entries jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e jsonb;
  changed integer;
  total integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if not public.is_admin() then
      raise exception 'set_recipe_image_variants: admin only';
    end if;
  end if;
  if jsonb_typeof(entries) is distinct from 'array' then
    raise exception 'set_recipe_image_variants: entries must be a JSON array';
  end if;

  for e in select value from jsonb_array_elements(entries) loop
    update public.recipe_images
       set storage_path = e ->> 'to_path',
           original_path = e ->> 'original_path',
           thumb_path = e ->> 'thumb_path',
           width = (e ->> 'width')::integer,
           height = (e ->> 'height')::integer
     where id = (e ->> 'id')::uuid
       and storage_path = e ->> 'from_path';
    get diagnostics changed = row_count;
    if changed <> 1 then
      raise exception 'recipe_images %: storage_path is not % — nothing changed',
        e ->> 'id', e ->> 'from_path';
    end if;
    total := total + 1;
  end loop;
  return total;
end;
$$;

create or replace function public.set_ingredient_image_variants(entries jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  e jsonb;
  changed integer;
  total integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if not public.is_admin() then
      raise exception 'set_ingredient_image_variants: admin only';
    end if;
  end if;
  if jsonb_typeof(entries) is distinct from 'array' then
    raise exception 'set_ingredient_image_variants: entries must be a JSON array';
  end if;

  for e in select value from jsonb_array_elements(entries) loop
    update public.ingredients
       set image_storage_path = e ->> 'to_path',
           image_original_path = e ->> 'original_path',
           image_width = (e ->> 'width')::integer,
           image_height = (e ->> 'height')::integer
     where id = (e ->> 'id')::uuid
       and image_storage_path = e ->> 'from_path';
    get diagnostics changed = row_count;
    if changed <> 1 then
      raise exception 'ingredients %: image_storage_path is not % — nothing changed',
        e ->> 'id', e ->> 'from_path';
    end if;
    total := total + 1;
  end loop;
  return total;
end;
$$;

revoke all on function public.set_recipe_image_variants(jsonb) from public, anon;
revoke all on function public.set_ingredient_image_variants(jsonb) from public, anon;
grant execute on function public.set_recipe_image_variants(jsonb) to authenticated, service_role;
grant execute on function public.set_ingredient_image_variants(jsonb) to authenticated, service_role;

commit;

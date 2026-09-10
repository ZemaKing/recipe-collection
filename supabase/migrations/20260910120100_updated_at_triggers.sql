-- Phase 4: updated_at triggers for mutable tables.

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on categories
  for each row execute function set_updated_at();

create trigger set_updated_at before update on tags
  for each row execute function set_updated_at();

create trigger set_updated_at before update on recipes
  for each row execute function set_updated_at();

create trigger set_updated_at before update on recipe_ingredients
  for each row execute function set_updated_at();

create trigger set_updated_at before update on recipe_steps
  for each row execute function set_updated_at();

create trigger set_updated_at before update on recipe_images
  for each row execute function set_updated_at();

create trigger set_updated_at before update on meal_plan_entries
  for each row execute function set_updated_at();

create trigger set_updated_at before update on kitchen_notes
  for each row execute function set_updated_at();

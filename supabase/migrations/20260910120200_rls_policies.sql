-- Phase 4: Row Level Security.
-- Every table: public (anon + authenticated) SELECT, authenticated-only writes.
-- This is a single-admin app; write policies do not scope by row owner.

alter table categories enable row level security;
alter table tags enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_steps enable row level security;
alter table recipe_tags enable row level security;
alter table recipe_images enable row level security;
alter table meal_plan_entries enable row level security;
alter table kitchen_notes enable row level security;

-- categories

create policy "categories_public_select" on categories
  for select using (true);
create policy "categories_authenticated_write" on categories
  for all to authenticated using (true) with check (true);

-- tags

create policy "tags_public_select" on tags
  for select using (true);
create policy "tags_authenticated_write" on tags
  for all to authenticated using (true) with check (true);

-- recipes

create policy "recipes_public_select" on recipes
  for select using (true);
create policy "recipes_authenticated_write" on recipes
  for all to authenticated using (true) with check (true);

-- recipe_ingredients

create policy "recipe_ingredients_public_select" on recipe_ingredients
  for select using (true);
create policy "recipe_ingredients_authenticated_write" on recipe_ingredients
  for all to authenticated using (true) with check (true);

-- recipe_steps

create policy "recipe_steps_public_select" on recipe_steps
  for select using (true);
create policy "recipe_steps_authenticated_write" on recipe_steps
  for all to authenticated using (true) with check (true);

-- recipe_tags

create policy "recipe_tags_public_select" on recipe_tags
  for select using (true);
create policy "recipe_tags_authenticated_write" on recipe_tags
  for all to authenticated using (true) with check (true);

-- recipe_images

create policy "recipe_images_public_select" on recipe_images
  for select using (true);
create policy "recipe_images_authenticated_write" on recipe_images
  for all to authenticated using (true) with check (true);

-- meal_plan_entries

create policy "meal_plan_entries_public_select" on meal_plan_entries
  for select using (true);
create policy "meal_plan_entries_authenticated_write" on meal_plan_entries
  for all to authenticated using (true) with check (true);

-- kitchen_notes

create policy "kitchen_notes_public_select" on kitchen_notes
  for select using (true);
create policy "kitchen_notes_authenticated_write" on kitchen_notes
  for all to authenticated using (true) with check (true);

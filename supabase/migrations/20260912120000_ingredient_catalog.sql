-- Phase 1 (post-MVP): Ingredient master-catalog + auto-calculated nutrition.
-- Bilingual content columns follow the existing paired _en/_sr convention.

-- ingredient_categories -----------------------------------------------------

create table ingredient_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_sr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ingredients -----------------------------------------------------------

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  ingredient_category_id uuid references ingredient_categories (id) on delete set null,
  name_en text not null,
  name_sr text,
  latin_name text,
  regional_names text,
  fact_en text,
  fact_sr text,
  default_unit_en text,
  default_unit_sr text,
  -- Nutrition per 100g.
  calories_kcal numeric check (calories_kcal >= 0),
  protein_g numeric check (protein_g >= 0),
  fat_g numeric check (fat_g >= 0),
  carbs_g numeric check (carbs_g >= 0),
  fiber_g numeric check (fiber_g >= 0),
  -- { "vitamin_a": { "amount": 540, "unit": "µg" }, ... }
  micronutrients jsonb not null default '{}',
  -- Grams-per-unit for this ingredient, e.g. { "kašika": 15, "čaša": 250 }.
  unit_conversions jsonb not null default '{}',
  image_storage_path text,
  image_alt_en text,
  image_alt_sr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingredients_category_idx on ingredients (ingredient_category_id);

-- Link recipe_ingredients rows to the catalog. Nullable: existing free-text
-- rows stay valid, and typing an ingredient with no catalog match is still
-- allowed (matches how the admin ingredient editor already behaves).
alter table recipe_ingredients
  add column ingredient_id uuid references ingredients (id) on delete set null;

create index recipe_ingredients_ingredient_id_idx on recipe_ingredients (ingredient_id);

-- updated_at triggers ---------------------------------------------------

create trigger set_updated_at before update on ingredient_categories
  for each row execute function set_updated_at();

create trigger set_updated_at before update on ingredients
  for each row execute function set_updated_at();

-- RLS: public select, authenticated-only writes (same pattern as every
-- other table in this schema).

alter table ingredient_categories enable row level security;
alter table ingredients enable row level security;

create policy "ingredient_categories_public_select" on ingredient_categories
  for select using (true);
create policy "ingredient_categories_authenticated_write" on ingredient_categories
  for all to authenticated using (true) with check (true);

create policy "ingredients_public_select" on ingredients
  for select using (true);
create policy "ingredients_authenticated_write" on ingredients
  for all to authenticated using (true) with check (true);

-- Predefined Vitamins/Minerals reference catalogs + per-ingredient values.
-- Replaces the old free-text `ingredients.micronutrients` entry flow in the
-- admin ingredient form with controlled catalogs (see IngredientForm.tsx).
-- The legacy `micronutrients` jsonb column itself is left untouched so the
-- existing recipe-detail nutrition panel keeps working unchanged.

-- vitamins / minerals ----------------------------------------------------

create table vitamins (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_sr text not null,
  unit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table minerals (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_sr text not null,
  unit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on vitamins
  for each row execute function set_updated_at();
create trigger set_updated_at before update on minerals
  for each row execute function set_updated_at();

-- ingredient_vitamins / ingredient_minerals (join tables) ----------------

create table ingredient_vitamins (
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  vitamin_id uuid not null references vitamins (id) on delete cascade,
  amount_per_100g numeric not null check (amount_per_100g >= 0),
  created_at timestamptz not null default now(),
  primary key (ingredient_id, vitamin_id)
);

create index ingredient_vitamins_vitamin_id_idx on ingredient_vitamins (vitamin_id);

create table ingredient_minerals (
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  mineral_id uuid not null references minerals (id) on delete cascade,
  amount_per_100g numeric not null check (amount_per_100g >= 0),
  created_at timestamptz not null default now(),
  primary key (ingredient_id, mineral_id)
);

create index ingredient_minerals_mineral_id_idx on ingredient_minerals (mineral_id);

-- seed --------------------------------------------------------------------

insert into vitamins (code, name_en, name_sr, unit) values
  ('A', 'Vitamin A', 'Vitamin A', 'µg'),
  ('B1', 'Thiamine', 'Tiamin', 'mg'),
  ('B2', 'Riboflavin', 'Riboflavin', 'mg'),
  ('B3', 'Niacin', 'Niacin', 'mg'),
  ('B5', 'Pantothenic Acid', 'Pantotenska kiselina', 'mg'),
  ('B6', 'Vitamin B6', 'Vitamin B6', 'mg'),
  ('B7', 'Biotin', 'Biotin', 'µg'),
  ('B9', 'Folate', 'Folat', 'µg'),
  ('B12', 'Cobalamin', 'Kobalamin', 'µg'),
  ('C', 'Vitamin C', 'Vitamin C', 'mg'),
  ('D', 'Vitamin D', 'Vitamin D', 'µg'),
  ('E', 'Vitamin E', 'Vitamin E', 'mg'),
  ('K', 'Vitamin K', 'Vitamin K', 'µg')
on conflict (code) do nothing;

insert into minerals (code, name_en, name_sr, unit) values
  ('Ca', 'Calcium', 'Kalcijum', 'mg'),
  ('Fe', 'Iron', 'Gvožđe', 'mg'),
  ('Mg', 'Magnesium', 'Magnezijum', 'mg'),
  ('P', 'Phosphorus', 'Fosfor', 'mg'),
  ('K', 'Potassium', 'Kalijum', 'mg'),
  ('Na', 'Sodium', 'Natrijum', 'mg'),
  ('Zn', 'Zinc', 'Cink', 'mg'),
  ('Cu', 'Copper', 'Bakar', 'mg'),
  ('Mn', 'Manganese', 'Mangan', 'mg'),
  ('Se', 'Selenium', 'Selen', 'µg'),
  ('I', 'Iodine', 'Jod', 'µg'),
  ('Cr', 'Chromium', 'Hrom', 'µg'),
  ('Mo', 'Molybdenum', 'Molibden', 'µg'),
  ('F', 'Fluoride', 'Fluorid', 'mg')
on conflict (code) do nothing;

-- one-time backfill: copy any pre-existing free-text micronutrient entries
-- that match a known catalog code into the new relational tables, so data
-- already entered through the old UI shows up in the new one. The legacy
-- `ingredients.micronutrients` jsonb column itself is left untouched.

insert into ingredient_vitamins (ingredient_id, vitamin_id, amount_per_100g)
select i.id, v.id, (i.micronutrients -> map.key ->> 'amount')::numeric
from ingredients i
cross join lateral (values
  ('vitamin_a', 'A'), ('vitamin_c', 'C'), ('vitamin_d', 'D'),
  ('vitamin_e', 'E'), ('vitamin_b12', 'B12')
) as map(key, code)
join vitamins v on v.code = map.code
where i.micronutrients ? map.key
on conflict (ingredient_id, vitamin_id) do nothing;

insert into ingredient_minerals (ingredient_id, mineral_id, amount_per_100g)
select i.id, m.id, (i.micronutrients -> map.key ->> 'amount')::numeric
from ingredients i
cross join lateral (values
  ('calcium', 'Ca'), ('iron', 'Fe'), ('potassium', 'K'),
  ('magnesium', 'Mg'), ('zinc', 'Zn'), ('sodium', 'Na')
) as map(key, code)
join minerals m on m.code = map.code
where i.micronutrients ? map.key
on conflict (ingredient_id, mineral_id) do nothing;

-- RLS: same public-read / authenticated-write pattern as every other table.

alter table vitamins enable row level security;
alter table minerals enable row level security;
alter table ingredient_vitamins enable row level security;
alter table ingredient_minerals enable row level security;

create policy "vitamins_public_select" on vitamins for select using (true);
create policy "vitamins_authenticated_write" on vitamins for all to authenticated using (true) with check (true);

create policy "minerals_public_select" on minerals for select using (true);
create policy "minerals_authenticated_write" on minerals for all to authenticated using (true) with check (true);

create policy "ingredient_vitamins_public_select" on ingredient_vitamins for select using (true);
create policy "ingredient_vitamins_authenticated_write" on ingredient_vitamins for all to authenticated using (true) with check (true);

create policy "ingredient_minerals_public_select" on ingredient_minerals for select using (true);
create policy "ingredient_minerals_authenticated_write" on ingredient_minerals for all to authenticated using (true) with check (true);

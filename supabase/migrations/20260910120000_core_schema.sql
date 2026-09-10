-- Phase 4: Core database schema for the Recipes app.
-- Bilingual content columns follow a paired _en/_sr convention: _en is required,
-- _sr is optional (falls back to _en in the UI).

create extension if not exists pgcrypto;

-- categories ---------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_sr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tags ----------------------------------------------------------------------

create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_sr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- recipes ---------------------------------------------------------------

create table recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid not null references categories (id) on delete restrict,
  name_en text not null,
  name_sr text,
  description_en text,
  description_sr text,
  prep_notes_en text,
  prep_notes_sr text,
  tips_en text,
  tips_sr text,
  prep_time_minutes integer check (prep_time_minutes >= 0),
  cook_time_minutes integer check (cook_time_minutes >= 0),
  servings integer check (servings > 0),
  weight_grams integer check (weight_grams >= 0),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_category_id_idx on recipes (category_id);

-- recipe_ingredients ----------------------------------------------------

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  order_index integer not null,
  name_en text not null,
  name_sr text,
  quantity numeric,
  unit_en text,
  unit_sr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, order_index)
);

create index recipe_ingredients_recipe_id_idx on recipe_ingredients (recipe_id);

-- recipe_steps ------------------------------------------------------------

create table recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  step_number integer not null,
  text_en text not null,
  text_sr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipe_id, step_number)
);

create index recipe_steps_recipe_id_idx on recipe_steps (recipe_id);

-- recipe_tags (join table) -----------------------------------------------

create table recipe_tags (
  recipe_id uuid not null references recipes (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, tag_id)
);

create index recipe_tags_tag_id_idx on recipe_tags (tag_id);

-- recipe_images -------------------------------------------------------------

create table recipe_images (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  storage_path text not null,
  alt_en text,
  alt_sr text,
  is_primary boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipe_images_recipe_id_idx on recipe_images (recipe_id);

-- Only one primary image per recipe.
create unique index recipe_images_one_primary_per_recipe
  on recipe_images (recipe_id)
  where is_primary;

-- meal_plan_entries -----------------------------------------------------

create table meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes (id) on delete set null,
  plan_date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_date, slot)
);

create index meal_plan_entries_recipe_id_idx on meal_plan_entries (recipe_id);

-- kitchen_notes -------------------------------------------------------------

create table kitchen_notes (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes (id) on delete set null,
  title_en text not null,
  title_sr text,
  body_en text,
  body_sr text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index kitchen_notes_recipe_id_idx on kitchen_notes (recipe_id);

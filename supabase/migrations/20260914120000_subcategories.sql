-- Phase 8: Category -> Subcategory -> Tags restructure.
-- Subcategories are optional per recipe (never force-fit); category stays required.

create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  slug text not null unique,
  name_en text not null,
  name_sr text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subcategories_category_id_idx on subcategories (category_id);

create trigger set_updated_at before update on subcategories
  for each row execute function set_updated_at();

alter table recipes add column subcategory_id uuid references subcategories (id) on delete set null;

create index recipes_subcategory_id_idx on recipes (subcategory_id);

alter table subcategories enable row level security;

create policy "subcategories_public_select" on subcategories
  for select using (true);
create policy "subcategories_authenticated_write" on subcategories
  for all to authenticated using (true) with check (true);

-- Category catalog corrections -------------------------------------------

update categories set name_en = 'Bread & Pastries', name_sr = 'Hleb i peciva'
where slug = 'peciva';

insert into categories (slug, name_en, name_sr)
values ('sosovi-prelivi-i-namazi', 'Sauces, Dressings & Spreads', 'Sosovi, prelivi i namazi')
on conflict (slug) do nothing;

-- "Ostalo" is confirmed unused (0 recipes) — retire it. Guarded so this is a
-- no-op instead of an error if that ever stops being true.
delete from categories
where slug = 'ostalo'
  and not exists (select 1 from recipes where recipes.category_id = categories.id);

-- New cross-cutting tags -----------------------------------------------------

insert into tags (slug, name_en, name_sr) values
  ('tradicionalno', 'Traditional', 'Tradicionalno'),
  ('posno', 'Lenten', 'Posno')
on conflict (slug) do nothing;

-- Subcategory seed ------------------------------------------------------------

insert into subcategories (category_id, slug, name_en, name_sr)
select c.id, v.slug, v.name_en, v.name_sr
from (values
  ('dorucak', 'jaja-i-omleti', 'Eggs & Omelets', 'Jaja i omleti'),
  ('dorucak', 'sendvici-i-tost', 'Sandwiches & Toast', 'Sendviči i tost'),
  ('dorucak', 'kase', 'Porridge', 'Kaše'),
  ('dorucak', 'palacinke-i-ustipci', 'Pancakes & Fritters', 'Palačinke i uštipci'),
  ('dorucak', 'dorucak-od-zitarica', 'Cereal Breakfasts', 'Doručak od žitarica'),

  ('predjela', 'hladna-predjela', 'Cold Appetizers', 'Hladna predjela'),
  ('predjela', 'topla-predjela', 'Hot Appetizers', 'Topla predjela'),
  ('predjela', 'kanapei-i-zalogaji', 'Canapés & Bites', 'Kanapei i zalogaji'),
  ('predjela', 'namazi-i-dipovi', 'Spreads & Dips', 'Namazi i dipovi'),
  ('predjela', 'mesna-predjela', 'Meat Appetizers', 'Mesna predjela'),
  ('predjela', 'predjela-od-povrca', 'Vegetable Appetizers', 'Predjela od povrća'),

  ('supe-i-corbe', 'bistre-supe', 'Clear Soups', 'Bistre supe'),
  ('supe-i-corbe', 'krem-supe-i-potazi', 'Cream Soups & Potages', 'Krem supe i potaži'),
  ('supe-i-corbe', 'mesne-corbe', 'Meat Stews', 'Mesne čorbe'),
  ('supe-i-corbe', 'riblje-corbe', 'Fish Stews', 'Riblje čorbe'),
  ('supe-i-corbe', 'povrtne-corbe', 'Vegetable Stews', 'Povrtne čorbe'),

  ('glavna-jela', 'piletina', 'Chicken', 'Piletina'),
  ('glavna-jela', 'svinjetina', 'Pork', 'Svinjetina'),
  ('glavna-jela', 'junetina', 'Beef', 'Junetina'),
  ('glavna-jela', 'mleveno-meso', 'Ground Meat', 'Mleveno meso'),
  ('glavna-jela', 'riba-i-morski-plodovi', 'Fish & Seafood', 'Riba i morski plodovi'),
  ('glavna-jela', 'testenine', 'Pasta', 'Testenine'),
  ('glavna-jela', 'pirinac-i-rizoto', 'Rice & Risotto', 'Pirinač i rižoto'),
  ('glavna-jela', 'jela-od-povrca', 'Vegetable Dishes', 'Jela od povrća'),
  ('glavna-jela', 'variva-i-mahunarke', 'Stews & Legumes', 'Variva i mahunarke'),

  ('salate', 'sveze-salate', 'Fresh Salads', 'Sveže salate'),
  ('salate', 'obrok-salate', 'Meal Salads', 'Obrok salate'),
  ('salate', 'mesne-salate', 'Meat Salads', 'Mesne salate'),
  ('salate', 'salate-sa-testeninom', 'Pasta Salads', 'Salate sa testeninom'),
  ('salate', 'krompir-salate', 'Potato Salads', 'Krompir salate'),

  ('prilozi', 'krompir', 'Potatoes', 'Krompir'),
  ('prilozi', 'pirinac', 'Rice', 'Pirinač'),
  ('prilozi', 'povrce', 'Vegetables', 'Povrće'),
  ('prilozi', 'testenina', 'Pasta', 'Testenina'),
  ('prilozi', 'ostali-prilozi', 'Other Sides', 'Ostali prilozi'),

  ('peciva', 'hleb', 'Bread', 'Hleb'),
  ('peciva', 'pogace', 'Flatbreads', 'Pogače'),
  ('peciva', 'kiflice', 'Rolls', 'Kiflice'),
  ('peciva', 'pite-i-burek', 'Pies & Burek', 'Pite i burek'),
  ('peciva', 'pizza', 'Pizza', 'Pizza'),
  ('peciva', 'slana-peciva', 'Savory Pastries', 'Slana peciva'),
  ('peciva', 'slatka-peciva', 'Sweet Pastries', 'Slatka peciva'),
  ('peciva', 'osnovna-testa', 'Base Doughs', 'Osnovna testa'),

  ('deserti', 'torte', 'Cakes', 'Torte'),
  ('deserti', 'kolaci', 'Pastries', 'Kolači'),
  ('deserti', 'sitni-kolaci', 'Small Cookies', 'Sitni kolači'),
  ('deserti', 'slatke-pite', 'Sweet Pies', 'Slatke pite'),
  ('deserti', 'kremasti-deserti', 'Creamy Desserts', 'Kremasti deserti'),
  ('deserti', 'puding-i-mus', 'Pudding & Mousse', 'Puding i mus'),
  ('deserti', 'sladoled', 'Ice Cream', 'Sladoled'),
  ('deserti', 'vocni-deserti', 'Fruit Desserts', 'Voćni deserti'),
  ('deserti', 'krofne-i-przeni-deserti', 'Donuts & Fried Desserts', 'Krofne i prženi deserti'),

  ('sosovi-prelivi-i-namazi', 'sosovi', 'Sauces', 'Sosovi'),
  ('sosovi-prelivi-i-namazi', 'prelivi', 'Dressings', 'Prelivi'),
  ('sosovi-prelivi-i-namazi', 'namazi', 'Spreads', 'Namazi'),
  ('sosovi-prelivi-i-namazi', 'dipovi', 'Dips', 'Dipovi'),
  ('sosovi-prelivi-i-namazi', 'marinade', 'Marinades', 'Marinade'),

  ('pica-i-napici', 'limunade', 'Lemonades', 'Limunade'),
  ('pica-i-napici', 'sokovi', 'Juices', 'Sokovi'),
  ('pica-i-napici', 'smoothie', 'Smoothies', 'Smoothie'),
  ('pica-i-napici', 'kafa', 'Coffee', 'Kafa'),
  ('pica-i-napici', 'caj', 'Tea', 'Čaj'),
  ('pica-i-napici', 'topli-napici', 'Hot Drinks', 'Topli napici'),
  ('pica-i-napici', 'kokteli', 'Cocktails', 'Kokteli'),
  ('pica-i-napici', 'bezalkoholni-kokteli', 'Mocktails', 'Bezalkoholni kokteli')
) as v(category_slug, slug, name_en, name_sr)
join categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

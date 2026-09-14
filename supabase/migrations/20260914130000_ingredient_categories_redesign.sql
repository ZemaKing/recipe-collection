-- Redesign the ingredient category list to match the new "Add Ingredient"
-- admin page (icon+description card grid, see src/lib/ingredientCategoryIcons.ts).
-- Categories with a direct predecessor are renamed in place (existing
-- ingredients keep their category); categories with no equivalent in the new
-- list are dropped and their ingredients fall back to uncategorized via the
-- existing `ingredient_category_id` ON DELETE SET NULL foreign key.

update ingredient_categories set
  slug = 'mleko-i-mlecni-proizvodi', name_en = 'Dairy & Milk Products', name_sr = 'Mleko i mlečni proizvodi'
  where slug = 'dairy';
update ingredient_categories set
  slug = 'povrce', name_en = 'Vegetables', name_sr = 'Povrće'
  where slug = 'vegetables';
update ingredient_categories set
  slug = 'voce', name_en = 'Fruit', name_sr = 'Voće'
  where slug = 'fruit';
update ingredient_categories set
  slug = 'ulja-i-masti', name_en = 'Oils & Fats', name_sr = 'Ulja i masti'
  where slug = 'oils-and-fats';
update ingredient_categories set
  slug = 'zitarice-testenine-i-peciva', name_en = 'Grains, Pasta & Baked Goods', name_sr = 'Žitarice, testenine i peciva'
  where slug = 'grains';
update ingredient_categories set
  slug = 'zacini-i-zacinsko-bilje', name_en = 'Herbs & Spices', name_sr = 'Začini i začinsko bilje'
  where slug = 'herbs-and-spices';
update ingredient_categories set
  slug = 'seceri-i-zasladjivaci', name_en = 'Sugars & Sweeteners', name_sr = 'Šećeri i zaslađivači'
  where slug = 'sweets';

-- No 1:1 equivalent in the new list (fish-and-meat splits into two separate
-- categories below, and misc-additives/vitamins-and-minerals have no
-- counterpart at all) — remove them rather than guess a mapping.
delete from ingredient_categories where slug in ('fish-and-meat', 'misc-additives', 'vitamins-and-minerals');

insert into ingredient_categories (slug, name_en, name_sr) values
  ('meso-i-mesne-preradjevine', 'Meat & Meat Products', 'Meso i mesne prerađevine'),
  ('riba-i-morski-plodovi', 'Fish & Seafood', 'Riba i morski plodovi'),
  ('jaja', 'Eggs', 'Jaja'),
  ('pecurke', 'Mushrooms', 'Pečurke'),
  ('pica-i-tecnosti', 'Beverages & Liquids', 'Pića i tečnosti')
on conflict (slug) do nothing;

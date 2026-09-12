-- Phase 6: Sample / seed data for local development.
-- Safe to re-run: categories/tags/recipes are upserted by slug, and each
-- recipe's child rows (ingredients/steps/tags/images) are replaced in full.
--
-- Content note: recipes marked "(source: public/*.pdf)" are adapted from the
-- Serbian recipe cards in public/ (translated to English, split into numbered
-- steps). The rest are original sample recipes added for category coverage.
-- "Domaća limunada" intentionally omits description_sr to exercise the
-- EN-fallback UI path (see Phase 6 i18n checklist).

begin;

-- categories -----------------------------------------------------------

insert into categories (slug, name_en, name_sr) values
  ('dorucak', 'Breakfast', 'Doručak'),
  ('supe-i-corbe', 'Soups', 'Supe i čorbe'),
  ('glavna-jela', 'Main Dishes', 'Glavna jela'),
  ('salate', 'Salads', 'Salate'),
  ('prilozi', 'Side Dishes', 'Prilozi'),
  ('deserti', 'Desserts', 'Deserti'),
  ('peciva', 'Pastries', 'Peciva'),
  ('pica-i-napici', 'Drinks', 'Pića i napici'),
  ('ostalo', 'Other', 'Ostalo')
on conflict (slug) do update set
  name_en = excluded.name_en,
  name_sr = excluded.name_sr;

-- tags -------------------------------------------------------------------
-- Matches the Phase 9 sidebar quick-filter chips.

insert into tags (slug, name_en, name_sr) values
  ('brzi-recepti', 'Quick Recipes', 'Brzi recepti'),
  ('za-pocetnike', 'For Beginners', 'Za početnike'),
  ('vegetarijanski', 'Vegetarian', 'Vegetarijanski'),
  ('bez-glutena', 'Gluten-Free', 'Bez glutena'),
  ('sezonski-recepti', 'Seasonal Recipes', 'Sezonski recepti'),
  ('mamin-recept', 'From Mom', 'Mamin recept')
on conflict (slug) do update set
  name_en = excluded.name_en,
  name_sr = excluded.name_sr;

-- recipes ------------------------------------------------------------------

do $$
declare
  v_cat_id uuid;
  v_recipe_id uuid;
begin

  -- 1. Gulaš (source: public/Gulaš.pdf) -----------------------------------
  select id into v_cat_id from categories where slug = 'glavna-jela';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_notes_en, prep_notes_sr, tips_en, tips_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'gulas', v_cat_id, 'Beef Goulash', 'Gulaš',
    'A classic beef and onion goulash, seasoned with paprika and a vegeta-style seasoning mix.',
    'Klasičan gulaš od junećeg mesa i luka, začinjen alevom paprikom i začinom C.',
    'You can substitute the beef with venison, roe deer, wild boar, or pork — game meat will need a longer cooking time.',
    'Umesto junećeg mesa, možete koristiti meso divljači (zečetina, srnetina, divlja svinja) ili domaću svinjetinu — meso divljači zahteva duže kuvanje.',
    'Try adding mushrooms alongside the meat, or serve over boiled rice instead of mashed potatoes or pasta.',
    'U gulaš možete dodati i šampinjone, a umesto pirea ili makarona možete ga servirati uz bareni pirinač.',
    20, 90, 4, 1200, 'medium', 4.5, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_notes_en = excluded.prep_notes_en, prep_notes_sr = excluded.prep_notes_sr,
    tips_en = excluded.tips_en, tips_sr = excluded.tips_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Beef, cubed', 'Juneće meso', 500, 'g', 'g'),
    (v_recipe_id, 2, 'Onion, finely chopped', 'Crni luk', 500, 'g', 'g'),
    (v_recipe_id, 3, 'Vegeta-style seasoning (Začin C)', 'Začin C', 2, 'tbsp', 'kašike'),
    (v_recipe_id, 4, 'Ground paprika', 'Aleva paprika', 2, 'tbsp', 'kašike'),
    (v_recipe_id, 5, 'Curry powder', 'Kari', 0.5, 'tsp', 'kašičice'),
    (v_recipe_id, 6, 'Ground black pepper', 'Biber', 0.5, 'tsp', 'kašičice'),
    (v_recipe_id, 7, 'Flour', 'Brašno', 2, 'tbsp', 'kašike'),
    (v_recipe_id, 8, 'Oil', 'Ulje', null, null, null),
    (v_recipe_id, 9, 'Water', 'Voda', null, null, null);

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Wash the beef and cut it into roughly 2×2 cm cubes.', 'Juneće meso operite i isecite na kockice, dimenzija oko 2×2 cm.'),
    (v_recipe_id, 2, 'Finely chop the onion and sauté it together with the beef until browned.', 'Sitno iseckajte crni luk i propržite ga zajedno sa mesom.'),
    (v_recipe_id, 3, 'Remove from the heat and stir in the seasoning and paprika.', 'Sklonite šerpu sa vatre i dodajte začin C i alevu papriku.'),
    (v_recipe_id, 4, 'Add water, return to the stove, and simmer until the meat is tender (test by tasting).', 'Dodajte vodu, vratite na ringlu i kuvajte dok meso ne omekša (proverite probanjem).'),
    (v_recipe_id, 5, 'Dissolve the flour in a cup of water, then stir it gradually into the simmering goulash to avoid lumps.', 'Razmutite brašno u šoljici vode i postepeno ga uz stalno mešanje sipajte u gulaš kako se ne bi stvorile grudvice.'),
    (v_recipe_id, 6, 'Stir in the curry and pepper and let everything simmer together once more.', 'Dodajte kari i biber i ostavite da još jednom zajedno provri.'),
    (v_recipe_id, 7, 'Serve hot over mashed potatoes or pasta, or with bread.', 'Servirajte toplo uz pire krompir ili makarone, ili sa hlebom.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'sezonski-recepti'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/gulas.jpg', 'Bowl of beef goulash with paprika', 'Činija gulaša sa alevom paprikom', true, 0);

  -- 2. Bakin kolač (source: public/Bakin kolač.pdf) -----------------------
  select id into v_cat_id from categories where slug = 'deserti';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    tips_en, tips_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'bakin-kolac', v_cat_id, 'Grandma''s Cake', 'Bakin kolač',
    'A simple, fluffy lemon-and-vanilla sponge cake, just like grandma used to make.',
    'Jednostavan sunđerasti kolač sa limunom i vanilom, baš kao kod bake.',
    'Swap the lemon zest for orange zest for a different aroma.',
    'Umesto korice limuna možete staviti koricu narandže za drugačiju aromu.',
    15, 35, 8, 900, 'easy', 4.7, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    tips_en = excluded.tips_en, tips_sr = excluded.tips_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Eggs', 'Jaja', 5, 'pcs', 'kom'),
    (v_recipe_id, 2, 'Sugar', 'Šećer', 250, 'g', 'g'),
    (v_recipe_id, 3, 'Milk', 'Mleko', 250, 'ml', 'ml'),
    (v_recipe_id, 4, 'Oil', 'Ulje', 100, 'ml', 'ml'),
    (v_recipe_id, 5, 'Lemon (zest)', 'Limun (kora)', 1, 'pcs', 'kom'),
    (v_recipe_id, 6, 'Vanilla sugar', 'Vanilice', 2, 'packet', 'kesice'),
    (v_recipe_id, 7, 'Baking powder', 'Prašak za pecivo', 1, 'packet', 'kesica'),
    (v_recipe_id, 8, 'Baking soda', 'Soda bikarbona', 0.5, 'tsp', 'kašičice'),
    (v_recipe_id, 9, 'Flour, as needed', 'Brašno, po potrebi', null, null, null);

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Whisk the eggs with the sugar, milk, oil, and grated lemon zest until combined.', 'Umutite jaja sa šećerom, mlekom, uljem i rendanom korom limuna.'),
    (v_recipe_id, 2, 'Stir in the vanilla sugar, baking powder, and baking soda.', 'Dodajte vanilice, prašak za pecivo i sodu bikarbonu.'),
    (v_recipe_id, 3, 'Gradually fold in flour until you reach a smooth, pourable batter.', 'Postepeno dodavajte brašno dok ne dobijete glatko testo koje se lako sipa.'),
    (v_recipe_id, 4, 'Pour into a greased baking pan and bake at 180°C (350°F) for about 35 minutes, until golden and a toothpick comes out clean.', 'Sipajte u nauljen kalup i pecite na 180°C oko 35 minuta, dok kolač ne porumeni i čačkalica ne izađe suva.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'za-pocetnike')),
    (v_recipe_id, (select id from tags where slug = 'vegetarijanski'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/bakin-kolac.jpg', 'Slice of grandma''s lemon sponge cake', 'Parče bakinog kolača sa limunom', true, 0);

  -- 3. Kinder kolač (source: public/Kinder kolač.pdf) ---------------------
  select id into v_cat_id from categories where slug = 'deserti';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'kinder-kolac', v_cat_id, 'Kinder-Style Wafer Cake', 'Kinder kolač',
    'A homemade wafer cake with two rich fillings — one with crushed biscuits and walnuts, the other with milk powder — layered between wafer sheets.',
    'Domaći kolač od mlevene plazme, oraha i mleka u prahu između dva oblatna sloja.',
    40, 15, 12, 1000, 'medium', 4.6, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Sugar', 'Šećer', 600, 'g', 'g'),
    (v_recipe_id, 2, 'Vanilla sugar', 'Vanilin šećer', 4, 'packet', 'kesice'),
    (v_recipe_id, 3, 'Margarine', 'Margarin', 2, 'block', 'kocke'),
    (v_recipe_id, 4, 'Crushed Plazma biscuits', 'Mlevena plazma', 300, 'g', 'g'),
    (v_recipe_id, 5, 'Ground walnuts', 'Mleveni orasi', 200, 'g', 'g'),
    (v_recipe_id, 6, 'Milk powder', 'Mleko u prahu', 300, 'g', 'g'),
    (v_recipe_id, 7, 'Water', 'Voda', 3, 'dl', 'dl'),
    (v_recipe_id, 8, 'Wafer sheets', 'Kore za oblande', 2, 'sheet', 'lista');

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'For the first filling: heat 300g sugar with 2dl water until dissolved, then add one block of margarine and 2 vanilla sugars and let them melt in.', 'Za prvi deo: zagrejte 300g šećera sa 2dl vode dok se ne rastopi, dodajte jedan margarin i 2 vanilice da se istope.'),
    (v_recipe_id, 2, 'Stir in the crushed Plazma biscuits and ground walnuts, combine well, and spread the warm mixture over one wafer sheet.', 'Umešajte mlevenu plazmu i mlevene orahe, sjedinite i toplo razvijte preko jedne oblande.'),
    (v_recipe_id, 3, 'For the second filling: heat the remaining sugar with 1dl water, add the remaining margarine and vanilla sugars, then gradually whisk in the milk powder (a mixer helps break up lumps) and simmer briefly.', 'Za drugi deo: zagrejte preostali šećer sa 1dl vode, dodajte preostali margarin i vanilice, pa postepeno umešajte mleko u prahu (mikserom razbijte grudvice) i malo prokuvajte.'),
    (v_recipe_id, 4, 'Spread the second filling warm over the second wafer sheet.', 'Toplo razvijte drugi deo preko druge oblande.'),
    (v_recipe_id, 5, 'Press the two wafer sheets together, filling sides facing in, and chill in the refrigerator until set before slicing.', 'Zalepite oblande jednu za drugu i ohladite u frižideru dok se ne stegnu, pa isecite.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'vegetarijanski'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/kinder-kolac.jpg', 'Sliced wafer cake with walnut and milk-powder filling', 'Isečen kolač od oblandi sa filom od oraha i mleka u prahu', true, 0);

  -- 4. Krempita (source: public/Krempita.pdf) ------------------------------
  select id into v_cat_id from categories where slug = 'deserti';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'krempita', v_cat_id, 'Krempita (Vanilla Custard Slice)', 'Krempita',
    'A soft sponge base layered with a fluffy vanilla custard made from cooked pudding folded into whipped egg whites.',
    'Sunđerasta kora sa slojem vanila krema od kuvanog pudinga i umućenih belanaca.',
    30, 25, 10, 1100, 'medium', 4.4, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Eggs, separated', 'Jaja', 6, 'pcs', 'kom'),
    (v_recipe_id, 2, 'Sugar', 'Šećer', 500, 'g', 'g'),
    (v_recipe_id, 3, 'Milk', 'Mleko', 150, 'ml', 'ml'),
    (v_recipe_id, 4, 'Oil', 'Ulje', null, null, null),
    (v_recipe_id, 5, 'Flour', 'Brašno', 150, 'g', 'g'),
    (v_recipe_id, 6, 'Baking powder', 'Prašak za pecivo', 1, 'packet', 'kesica'),
    (v_recipe_id, 7, 'Vanilla pudding', 'Puding od vanile', 4, 'packet', 'kutije');

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Separate the eggs. Whisk the yolks with 8 tbsp sugar, 8 tbsp milk, 8 tbsp oil, 8 tbsp flour, and the baking powder into a smooth batter.', 'Odvojite žumanca od belanaca. Umutite žumanca sa 8 kašika šećera, 8 kašika mleka, 8 kašika ulja, 8 kašika brašna i praškom za pecivo.'),
    (v_recipe_id, 2, 'Pour the batter into a baking pan and bake until golden.', 'Sipajte smesu u kalup i pecite dok ne porumeni.'),
    (v_recipe_id, 3, 'Cook the vanilla pudding with 800ml water (reserving 200ml to first dissolve the pudding powder) and 350g sugar until thickened.', 'Skuvajte puding sa 800ml vode (200ml ostavite da rastvorite prah pudinga) i 350g šećera dok se ne zgusne.'),
    (v_recipe_id, 4, 'Whisk the egg whites to stiff peaks, then fold in the hot pudding one spoonful at a time until glossy and combined.', 'Umutite šnel od belanaca, pa dodavajte vrući puding kašiku po kašiku dok se ne sjedini.'),
    (v_recipe_id, 5, 'Spread the custard over the baked crust and chill in the refrigerator for at least 2 hours before slicing.', 'Prelijte kremom pečenu koru i ohladite u frižideru najmanje 2 sata pre sečenja.');

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/krempita.jpg', 'Square of krempita vanilla custard slice', 'Kocka krempite sa kremom od vanile', true, 0);

  -- 5. Medenjaci (source: public/Medenjaci.pdf) ----------------------------
  select id into v_cat_id from categories where slug = 'peciva';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'medenjaci', v_cat_id, 'Honey Spice Cookies (Medenjaci)', 'Medenjaci',
    'Soft honey cookies spiced with cinnamon and cloves.',
    'Mekani medeni kolačići sa cimetom i karanfilićem.',
    20, 15, 20, 500, 'easy', 4.3, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Eggs', 'Jaja', 3, 'pcs', 'kom'),
    (v_recipe_id, 2, 'Sugar', 'Šećer', 250, 'g', 'g'),
    (v_recipe_id, 3, 'Honey', 'Med', null, null, null),
    (v_recipe_id, 4, 'Baking soda', 'Soda bikarbona', null, null, null),
    (v_recipe_id, 5, 'Cinnamon', 'Cimet', null, null, null),
    (v_recipe_id, 6, 'Cloves', 'Karanfilić', null, null, null),
    (v_recipe_id, 7, 'Flour, as needed', 'Brašno, po potrebi', null, null, null);

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Beat the eggs with the sugar until pale and fluffy.', 'Umutite jaja sa šećerom dok smesa ne postane svetla i penasta.'),
    (v_recipe_id, 2, 'Stir in 8 tbsp honey, ½ tsp baking soda, ½ tsp cinnamon, 3–4 cloves, and enough flour to form a soft, workable dough.', 'Dodajte 8 kašika meda, ½ kašičice sode bikarbone, ½ kašičice cimeta, 3-4 karanfilića i brašna koliko je potrebno da dobijete meko testo.'),
    (v_recipe_id, 3, 'Shape the dough into small balls and place on a lined baking tray.', 'Oblikujte testo u kuglice i poređajte na pleh sa papirom za pečenje.'),
    (v_recipe_id, 4, 'Bake until golden and firm to the touch, then let cool completely before serving.', 'Pecite dok ne porumene i očvrsnu, pa ostavite da se potpuno ohlade pre serviranja.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'za-pocetnike'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/medenjaci.jpg', 'Plate of honey spice cookies', 'Tanjir medenjaka', true, 0);

  -- 6. Plazma torta (source: public/Plazma torta.pdf) ---------------------
  select id into v_cat_id from categories where slug = 'deserti';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'plazma-torta', v_cat_id, 'Plazma Biscuit Cake', 'Plazma torta',
    'A light sponge base filled with a rich margarine, walnut, and crushed-biscuit cream, finished with whipped cream.',
    'Sunđerasta kora punjena kremom od margarina, oraha i mlevene plazme, ukrašena šlag kremom.',
    40, 25, 12, 1300, 'medium', 4.8, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Eggs, separated', 'Jaja', 6, 'pcs', 'kom'),
    (v_recipe_id, 2, 'Sugar', 'Šećer', null, null, null),
    (v_recipe_id, 3, 'Flour', 'Brašno', null, null, null),
    (v_recipe_id, 4, 'Baking powder', 'Prašak za pecivo', 1, 'packet', 'kesica'),
    (v_recipe_id, 5, 'Walnuts', 'Orasi', 200, 'g', 'g'),
    (v_recipe_id, 6, 'Margarine', 'Margarin', 1, 'block', 'kocka'),
    (v_recipe_id, 7, 'Whipped cream', 'Šlag krem', 1, 'packet', 'kesica'),
    (v_recipe_id, 8, 'Powdered sugar', 'Šećer u prahu', 250, 'g', 'g'),
    (v_recipe_id, 9, 'Crushed Plazma biscuits', 'Mlevena plazma', 1, 'box', 'kutija'),
    (v_recipe_id, 10, 'Orange', 'Narandža', 1, 'pcs', 'kom');

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Separate the eggs. Whip the whites to stiff peaks; separately whip the yolks with 6 tbsp sugar until pale, then fold into the whites.', 'Odvojite belanca od žumanaca. Umutite belanca u šnel, a posebno umutite žumanca sa 6 kašika šećera, pa ih sjedinite.'),
    (v_recipe_id, 2, 'Gently fold in 4 tbsp flour and half a packet of baking powder, then fold in 3 tbsp of the walnuts. Pour into a pan and bake until golden.', 'Lagano umešajte 4 kašike brašna i pola praška za pecivo, pa dodajte 3 kašike oraha. Sipajte u kalup i pecite dok ne porumeni.'),
    (v_recipe_id, 3, 'Beat the margarine until fluffy, then beat in the powdered sugar and the remaining walnuts, followed by the crushed Plazma biscuits and the juice of the orange.', 'Umutite margarin, pa dodajte šećer u prahu i preostale orahe, a zatim mlevenu plazmu i sok od narandže.'),
    (v_recipe_id, 4, 'Slice the baked crust in half horizontally, spread the filling between the layers, and decorate the top with whipped cream.', 'Iseite pečenu koru na pola, ispunite filom i ukrasite vrh šlag kremom.');

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/plazma-torta.jpg', 'Slice of Plazma biscuit cake with whipped cream', 'Parče plazma torte sa šlag kremom', true, 0);

  -- 7. Raffaello kuglice (source: public/Raffaello kuglice.pdf) -----------
  select id into v_cat_id from categories where slug = 'deserti';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'raffaello-kuglice', v_cat_id, 'Raffaello Coconut Truffles', 'Raffaello kuglice',
    'No-bake coconut truffles made with condensed milk, with a whole almond hidden inside each one.',
    'Brze kuglice bez pečenja od kokosovog brašna, kondenzovanog mleka i badema.',
    20, 0, 15, 400, 'easy', 4.9, true
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Desiccated coconut', 'Kokosovo brašno', 200, 'g', 'g'),
    (v_recipe_id, 2, 'Condensed milk', 'Kondenzovano mleko', 400, 'g', 'g'),
    (v_recipe_id, 3, 'Whole almonds', 'Badem', 50, 'g', 'g');

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'In a deep bowl, mix the desiccated coconut with the condensed milk.', 'U dubokoj posudi izmešajte kokosovo brašno i kondenzovano mleko.'),
    (v_recipe_id, 2, 'Let the mixture rest for 5 minutes so the coconut absorbs the condensed milk.', 'Ostavite smesu 5 minuta da kokos upije kondenzovano mleko.'),
    (v_recipe_id, 3, 'Scoop about one tablespoon of the mixture per truffle, place an almond in the center, and shape into a ball.', 'Uzmite oko jednu kašiku smese za svaku kuglicu, stavite badem u sredinu i oblikujte kuglicu.'),
    (v_recipe_id, 4, 'Roll each truffle again in desiccated coconut to coat, then serve. Store in the refrigerator.', 'Uvaljajte kuglicu ponovo u kokosovo brašno i servirajte. Čuvajte u frižideru.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'brzi-recepti')),
    (v_recipe_id, (select id from tags where slug = 'za-pocetnike')),
    (v_recipe_id, (select id from tags where slug = 'bez-glutena'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/raffaello-kuglice.jpg', 'Coconut truffles with almond filling', 'Raffaello kuglice sa bademom', true, 0);

  -- 8. Tulumbe (source: public/Tulumbe.pdf) --------------------------------
  select id into v_cat_id from categories where slug = 'deserti';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'tulumbe', v_cat_id, 'Tulumbe (Fried Choux Pastry in Syrup)', 'Tulumbe',
    'Deep-fried choux pastry fingers soaked in cold sugar syrup — a beloved Balkan dessert.',
    'Pržene mini krofnice od testa za princes krofne, natopljene hladnim sirupom.',
    30, 40, 20, 900, 'hard', 4.6, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Oil, for frying', 'Ulje za prženje', 1, 'l', 'l'),
    (v_recipe_id, 2, 'Flour', 'Brašno', 300, 'g', 'g'),
    (v_recipe_id, 3, 'Eggs', 'Jaja', 6, 'pcs', 'kom'),
    (v_recipe_id, 4, 'Baking powder', 'Prašak za pecivo', 1, 'packet', 'kesica'),
    (v_recipe_id, 5, 'Sugar, for the syrup', 'Šećer, za sirup', null, null, null);

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Bring a beer-bottle''s worth of water with a small coffee cup of oil to a boil.', 'Prokuvajte flašu vode (kao pivska flaša) sa malo ulja (kafena šoljica).'),
    (v_recipe_id, 2, 'Remove from the heat and stir in the flour until a smooth dough forms.', 'Sklonite sa vatre i umešajte brašno dok ne dobijete glatko testo.'),
    (v_recipe_id, 3, 'Once the dough has cooled, beat in the eggs one at a time along with the baking powder until smooth and glossy.', 'Kada se testo ohladi, umutite jaja jedno po jedno zajedno sa praškom za pecivo dok testo ne postane glatko i sjajno.'),
    (v_recipe_id, 4, 'Pipe the dough into finger-length pieces directly into 1 liter of hot oil and fry until golden and crisp.', 'Istisnite testo u obliku prstića direktno u vreo tiganj sa 1l ulja i pržite dok ne porumene i postanu hrskave.'),
    (v_recipe_id, 5, 'Meanwhile, make the syrup: simmer the sugar with water until it thickens slightly.', 'U međuvremenu skuvajte sirup: prokuvajte šećer sa vodom dok se malo ne zgusne.'),
    (v_recipe_id, 6, 'Pour the hot syrup over the cooled fried tulumbe and let them soak before serving.', 'Prelijte vrelim sirupom ohlađene pržene tulumbe i ostavite da upiju sirup pre serviranja.');

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/tulumbe.jpg', 'Plate of syrup-soaked tulumbe', 'Tanjir tulumbi natopljenih sirupom', true, 0);

  -- 9. Štrudla sa makom (source: public/Štrudla sa makom.pdf) -------------
  select id into v_cat_id from categories where slug = 'peciva';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'strudla-sa-makom', v_cat_id, 'Poppy Seed Strudel', 'Štrudla sa makom',
    'A soft yeasted dough rolled and filled with sweetened poppy seeds.',
    'Meko kvasno testo punjeno slatkim makom.',
    40, 35, 10, 1000, 'medium', 4.5, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Milk', 'Mleko', 500, 'ml', 'ml'),
    (v_recipe_id, 2, 'Oil', 'Ulje', null, null, null),
    (v_recipe_id, 3, 'Salt', 'So', 0.5, 'tsp', 'kašičice'),
    (v_recipe_id, 4, 'Sugar', 'Šećer', null, null, null),
    (v_recipe_id, 5, 'Eggs', 'Jaja', 2, 'pcs', 'kom'),
    (v_recipe_id, 6, 'Flour', 'Brašno', 1, 'kg', 'kg'),
    (v_recipe_id, 7, 'Fresh yeast', 'Kvasac', 0.33, 'cube', 'kockice'),
    (v_recipe_id, 8, 'Poppy seeds', 'Mak', 300, 'g', 'g');

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Combine the milk, oil, salt, sugar, eggs, and flour with the yeast; knead into a smooth, elastic dough and let it rise until doubled in size.', 'Sjedinite mleko, ulje, so, šećer, jaja i brašno sa kvascem; umesite glatko, elastično testo i ostavite da naraste dvostruko.'),
    (v_recipe_id, 2, 'Roll the dough out into a thin sheet.', 'Razvijte testo u tanku koru.'),
    (v_recipe_id, 3, 'Mix the poppy seeds with sugar and spread evenly over the dough.', 'Izmešajte mak sa šećerom i ravnomerno rasporedite preko testa.'),
    (v_recipe_id, 4, 'Roll up tightly, place in a baking pan, and bake until golden brown.', 'Uvijte testo čvrsto u rolat, stavite u pleh i pecite dok ne porumeni.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'vegetarijanski'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/strudla-sa-makom.jpg', 'Sliced poppy seed strudel', 'Isečena štrudla sa makom', true, 0);

  -- 10. Kajgana sa povrćem (original) --------------------------------------
  select id into v_cat_id from categories where slug = 'dorucak';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'kajgana-sa-povrcem', v_cat_id, 'Vegetable Scrambled Eggs', 'Kajgana sa povrćem',
    'A quick, colorful scrambled-egg breakfast with peppers, tomato, and spring onion.',
    'Brz i šaren doručak od kajgane sa paprikom, paradajzom i mladim lukom.',
    10, 10, 2, 350, 'easy', 4.2, true
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Eggs', 'Jaja', 4, 'pcs', 'kom'),
    (v_recipe_id, 2, 'Red bell pepper, diced', 'Crvena paprika, kockice', 1, 'pcs', 'kom'),
    (v_recipe_id, 3, 'Tomato, diced', 'Paradajz, kockice', 1, 'pcs', 'kom'),
    (v_recipe_id, 4, 'Spring onions, sliced', 'Mladi luk', 2, 'pcs', 'kom'),
    (v_recipe_id, 5, 'Salt and pepper, to taste', 'So i biber, po ukusu', null, null, null),
    (v_recipe_id, 6, 'Oil', 'Ulje', 2, 'tbsp', 'kašike');

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Heat the oil in a pan over medium heat and sauté the pepper and spring onion for 2–3 minutes until softened.', 'Zagrejte ulje u tiganju na srednjoj vatri i pržite papriku i mladi luk 2-3 minuta dok ne omekšaju.'),
    (v_recipe_id, 2, 'Add the tomato and cook for another minute.', 'Dodajte paradajz i kuvajte još minut.'),
    (v_recipe_id, 3, 'Whisk the eggs with salt and pepper, pour into the pan, and gently scramble until just set.', 'Umutite jaja sa solju i biberom, sipajte u tiganj i lagano mešajte dok se ne zgusnu.'),
    (v_recipe_id, 4, 'Serve immediately, with bread on the side.', 'Poslužite odmah, uz hleb.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'brzi-recepti')),
    (v_recipe_id, (select id from tags where slug = 'za-pocetnike')),
    (v_recipe_id, (select id from tags where slug = 'vegetarijanski'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/kajgana-sa-povrcem.jpg', 'Scrambled eggs with peppers and tomato', 'Kajgana sa paprikom i paradajzom', true, 0);

  -- 11. Pileća supa (original) ----------------------------------------------
  select id into v_cat_id from categories where slug = 'supe-i-corbe';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'pileca-supa', v_cat_id, 'Chicken Soup', 'Pileća supa',
    'A comforting clear chicken soup with root vegetables and noodles.',
    'Bistra pileća supa sa korenastim povrćem i rezancima.',
    15, 90, 6, 2500, 'easy', 4.6, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Whole chicken (or chicken pieces)', 'Cela piletina (ili delovi)', 1.2, 'kg', 'kg'),
    (v_recipe_id, 2, 'Carrots', 'Šargarepa', 2, 'pcs', 'kom'),
    (v_recipe_id, 3, 'Parsley root', 'Koren peršuna', 1, 'pcs', 'kom'),
    (v_recipe_id, 4, 'Celery root', 'Celer', 0.25, 'pcs', 'kom'),
    (v_recipe_id, 5, 'Onion', 'Crni luk', 1, 'pcs', 'kom'),
    (v_recipe_id, 6, 'Salt, to taste', 'So, po ukusu', null, null, null),
    (v_recipe_id, 7, 'Black peppercorns', 'Zrna bibera', null, null, null),
    (v_recipe_id, 8, 'Soup noodles', 'Rezanci za supu', 100, 'g', 'g');

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Place the chicken in a large pot, cover with cold water, and bring to a boil, skimming off any foam.', 'Stavite piletinu u veliki lonac, prelijte hladnom vodom i prokuvajte, skidajući penu.'),
    (v_recipe_id, 2, 'Add the carrots, parsley root, celery root, onion, salt, and peppercorns; simmer gently for about 1.5 hours.', 'Dodajte šargarepu, koren peršuna, celer, luk, so i biber u zrnu; kuvajte na tihoj vatri oko sat i po.'),
    (v_recipe_id, 3, 'Remove the chicken and vegetables; strain the broth if a clearer soup is preferred.', 'Izvadite piletinu i povrće; procedite supu ukoliko želite bistriju.'),
    (v_recipe_id, 4, 'Cook the noodles in the broth for the last 10 minutes.', 'Skuvajte rezance u supi poslednjih 10 minuta.'),
    (v_recipe_id, 5, 'Slice some of the cooked carrot and chicken back into the bowl before serving.', 'Dodajte iseckanu šargarepu i piletinu nazad u tanjir pre serviranja.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'sezonski-recepti'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/pileca-supa.jpg', 'Bowl of chicken soup with noodles', 'Tanjir pileće supe sa rezancima', true, 0);

  -- 12. Šopska salata (original) ---------------------------------------------
  select id into v_cat_id from categories where slug = 'salate';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'sopska-salata', v_cat_id, 'Shopska Salad', 'Šopska salata',
    'A fresh Balkan salad of tomato, cucumber, and pepper, topped with grated white cheese.',
    'Sveža balkanska salata od paradajza, krastavca i paprike, posuta rendanim belim sirom.',
    15, 0, 4, 600, 'easy', 4.7, true
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Tomatoes, diced', 'Paradajz, kockice', 3, 'pcs', 'kom'),
    (v_recipe_id, 2, 'Cucumbers, diced', 'Krastavac, kockice', 2, 'pcs', 'kom'),
    (v_recipe_id, 3, 'Green bell pepper, diced', 'Zelena paprika, kockice', 1, 'pcs', 'kom'),
    (v_recipe_id, 4, 'Small red onion, thinly sliced', 'Crveni luk, tanke kriške', 1, 'pcs', 'kom'),
    (v_recipe_id, 5, 'White brined cheese, grated', 'Beli sir, rendan', 150, 'g', 'g'),
    (v_recipe_id, 6, 'Olive oil', 'Maslinovo ulje', 2, 'tbsp', 'kašike'),
    (v_recipe_id, 7, 'Salt, to taste', 'So, po ukusu', null, null, null);

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Combine the tomato, cucumber, pepper, and onion in a large bowl.', 'Sjedinite paradajz, krastavac, papriku i luk u velikoj posudi.'),
    (v_recipe_id, 2, 'Drizzle with olive oil, season with salt, and toss gently.', 'Prelijte maslinovim uljem, posolite i lagano promešajte.'),
    (v_recipe_id, 3, 'Top generously with the grated white cheese just before serving.', 'Pre serviranja obilno posujte rendanim belim sirom.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'brzi-recepti')),
    (v_recipe_id, (select id from tags where slug = 'za-pocetnike')),
    (v_recipe_id, (select id from tags where slug = 'vegetarijanski')),
    (v_recipe_id, (select id from tags where slug = 'bez-glutena')),
    (v_recipe_id, (select id from tags where slug = 'sezonski-recepti'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/sopska-salata.jpg', 'Shopska salad topped with grated white cheese', 'Šopska salata posuta belim sirom', true, 0);

  -- 13. Pire krompir (original) -----------------------------------------
  select id into v_cat_id from categories where slug = 'prilozi';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'pire-krompir', v_cat_id, 'Mashed Potatoes', 'Pire krompir',
    'Creamy mashed potatoes with butter and warm milk.',
    'Kremast pire krompir sa puterom i toplim mlekom.',
    10, 25, 4, 800, 'easy', 4.4, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Potatoes, peeled and cubed', 'Krompir, oljušten i iseckan', 1, 'kg', 'kg'),
    (v_recipe_id, 2, 'Butter', 'Puter', 50, 'g', 'g'),
    (v_recipe_id, 3, 'Warm milk', 'Toplo mleko', 150, 'ml', 'ml'),
    (v_recipe_id, 4, 'Salt, to taste', 'So, po ukusu', null, null, null);

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Boil the potatoes in salted water until fork-tender, about 20 minutes, then drain well.', 'Kuvajte krompir u posoljenoj vodi dok ne omekša, oko 20 minuta, pa ocedite.'),
    (v_recipe_id, 2, 'Mash the potatoes while hot, then stir in the butter until melted.', 'Izgnječite krompir dok je vreo i umešajte puter dok se ne otopi.'),
    (v_recipe_id, 3, 'Gradually add the warm milk, mashing until smooth and creamy; season with salt to taste.', 'Postepeno dodavajte toplo mleko, mešajući dok pire ne postane gladak i kremast; posolite po ukusu.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'za-pocetnike')),
    (v_recipe_id, (select id from tags where slug = 'vegetarijanski')),
    (v_recipe_id, (select id from tags where slug = 'bez-glutena'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/pire-krompir.jpg', 'Bowl of creamy mashed potatoes', 'Činija kremastog pire krompira', true, 0);

  -- 14. Domaća limunada (original) ----------------------------------------
  -- Deliberately missing description_sr to exercise the EN-fallback UI path.
  select id into v_cat_id from categories where slug = 'pica-i-napici';

  insert into recipes (
    slug, category_id, name_en, name_sr, description_en, description_sr,
    prep_time_minutes, cook_time_minutes, servings, weight_grams,
    difficulty, rating, is_favorite
  ) values (
    'domaca-limunada', v_cat_id, 'Homemade Lemonade', 'Domaća limunada',
    'A refreshing homemade lemonade with fresh mint.',
    null,
    10, 0, 6, 1500, 'easy', 4.5, false
  )
  on conflict (slug) do update set
    category_id = excluded.category_id, name_en = excluded.name_en, name_sr = excluded.name_sr,
    description_en = excluded.description_en, description_sr = excluded.description_sr,
    prep_time_minutes = excluded.prep_time_minutes, cook_time_minutes = excluded.cook_time_minutes,
    servings = excluded.servings, weight_grams = excluded.weight_grams,
    difficulty = excluded.difficulty, rating = excluded.rating, is_favorite = excluded.is_favorite
  returning id into v_recipe_id;

  delete from recipe_ingredients where recipe_id = v_recipe_id;
  delete from recipe_steps where recipe_id = v_recipe_id;
  delete from recipe_tags where recipe_id = v_recipe_id;
  delete from recipe_images where recipe_id = v_recipe_id;

  insert into recipe_ingredients (recipe_id, order_index, name_en, name_sr, quantity, unit_en, unit_sr) values
    (v_recipe_id, 1, 'Lemons, juiced', 'Limun, sok', 4, 'pcs', 'kom'),
    (v_recipe_id, 2, 'Sugar, or to taste', 'Šećer, po ukusu', 100, 'g', 'g'),
    (v_recipe_id, 3, 'Cold water', 'Hladna voda', 1.5, 'l', 'l'),
    (v_recipe_id, 4, 'Fresh mint sprigs', 'Sveža nana', null, null, null),
    (v_recipe_id, 5, 'Ice cubes', 'Kockice leda', null, null, null);

  insert into recipe_steps (recipe_id, step_number, text_en, text_sr) values
    (v_recipe_id, 1, 'Dissolve the sugar in a small amount of warm water to make a simple syrup, then let it cool.', 'Rastvorite šećer u malo tople vode da dobijete sirup, pa ostavite da se ohladi.'),
    (v_recipe_id, 2, 'Combine the lemon juice, syrup, and cold water in a large pitcher.', 'Sjedinite sok od limuna, sirup i hladnu vodu u velikom vrču.'),
    (v_recipe_id, 3, 'Add mint sprigs and ice, stir well, and serve chilled.', 'Dodajte nanu i led, dobro promešajte i poslužite ohlađeno.');

  insert into recipe_tags (recipe_id, tag_id) values
    (v_recipe_id, (select id from tags where slug = 'brzi-recepti')),
    (v_recipe_id, (select id from tags where slug = 'za-pocetnike')),
    (v_recipe_id, (select id from tags where slug = 'vegetarijanski')),
    (v_recipe_id, (select id from tags where slug = 'bez-glutena')),
    (v_recipe_id, (select id from tags where slug = 'sezonski-recepti'));

  insert into recipe_images (recipe_id, storage_path, alt_en, alt_sr, is_primary, order_index) values
    (v_recipe_id, 'seed/domaca-limunada.jpg', 'Pitcher of lemonade with mint and ice', 'Vrč limunade sa nanom i ledom', true, 0);

end $$;

-- meal_plan_entries -------------------------------------------------------
-- Note: no public SELECT policy on this table (Phase 4 RLS); admin-only.

insert into meal_plan_entries (recipe_id, plan_date, slot, note)
select id, current_date + 2, 'dinner', null
from recipes where slug = 'gulas'
on conflict (plan_date, slot) do update set recipe_id = excluded.recipe_id, note = excluded.note;

insert into meal_plan_entries (recipe_id, plan_date, slot, note)
select id, current_date + 4, 'lunch', 'Light lunch'
from recipes where slug = 'sopska-salata'
on conflict (plan_date, slot) do update set recipe_id = excluded.recipe_id, note = excluded.note;

-- kitchen_notes -------------------------------------------------------------
-- Note: no public SELECT policy on this table (Phase 4 RLS); admin-only.

delete from kitchen_notes where title_en in ('Always use fresh mint', 'Ideas for next time');

insert into kitchen_notes (recipe_id, title_en, title_sr, body_en, body_sr, is_pinned)
select id,
  'Always use fresh mint', 'Uvek koristi svežu nanu',
  'Dried mint changes the flavor too much for lemonade — worth a trip to the store for fresh sprigs.',
  'Suva nana previše menja ukus limunade — vredi otići do prodavnice po svežu nanu.',
  true
from recipes where slug = 'domaca-limunada';

insert into kitchen_notes (recipe_id, title_en, title_sr, body_en, body_sr, is_pinned)
values (
  null,
  'Ideas for next time', 'Ideje za sledeći put',
  'Try a savory strudel filling (spinach and cheese) using the same dough as the poppy seed strudel.',
  'Isprobati slanu štrudlu (spanać i sir) sa istim testom kao za štrudlu sa makom.',
  false
);

-- ingredient_categories -------------------------------------------------
-- Matches the reference-library folder structure (Phase 1: ingredient catalog).

insert into ingredient_categories (slug, name_en, name_sr) values
  ('dairy', 'Dairy', 'Mleko i mlečni proizvodi'),
  ('vegetables', 'Vegetables', 'Povrće'),
  ('misc-additives', 'Misc / Additives', 'Prilozi i dodaci'),
  ('fish-and-meat', 'Fish & Meat', 'Riba i meso'),
  ('sweets', 'Sweets', 'Slatkiši i poslastice'),
  ('oils-and-fats', 'Oils & Fats', 'Ulja i masti'),
  ('vitamins-and-minerals', 'Vitamins & Minerals', 'Vitamini i minerali'),
  ('fruit', 'Fruit', 'Voće'),
  ('herbs-and-spices', 'Herbs & Spices', 'Začini i bilje'),
  ('grains', 'Grains', 'Žitarice')
on conflict (slug) do update set
  name_en = excluded.name_en,
  name_sr = excluded.name_sr;

-- ingredients -------------------------------------------------------------
-- A starter set covering Šopska salata's ingredients (so the nutrition
-- auto-calculation has real data to demonstrate end to end) plus a couple
-- of extras for the admin autocomplete demo.

do $$
declare
  v_ing_cat_id uuid;
begin

  select id into v_ing_cat_id from ingredient_categories where slug = 'vegetables';
  insert into ingredients (
    slug, ingredient_category_id, name_en, name_sr, latin_name,
    fact_en, fact_sr, default_unit_en, default_unit_sr,
    calories_kcal, protein_g, fat_g, carbs_g, fiber_g, micronutrients, unit_conversions
  ) values
    (
      'tomato', v_ing_cat_id, 'Tomato', 'Paradajz', 'Solanum lycopersicum',
      'Rich in vitamin C and lycopene, an antioxidant linked to heart health.',
      'Bogat vitaminom C i likopenom, antioksidansom povezanim sa zdravljem srca.',
      'g', 'g', 18, 0.9, 0.2, 3.9, 1.2,
      '{"vitamin_c": {"amount": 14, "unit": "mg"}, "potassium": {"amount": 237, "unit": "mg"}}',
      '{"pcs": 123, "kom": 123}'
    ),
    (
      'cucumber', v_ing_cat_id, 'Cucumber', 'Krastavac', 'Cucumis sativus',
      'Mostly water, making it naturally low-calorie and hydrating.',
      'Uglavnom voda, zbog čega je prirodno niskokaloričan i hidrira organizam.',
      'g', 'g', 15, 0.7, 0.1, 3.6, 0.5,
      '{"vitamin_c": {"amount": 2.8, "unit": "mg"}, "potassium": {"amount": 147, "unit": "mg"}}',
      '{"pcs": 150, "kom": 150}'
    ),
    (
      'green-bell-pepper', v_ing_cat_id, 'Green Bell Pepper', 'Zelena paprika', 'Capsicum annuum',
      'One of the richest common vegetable sources of vitamin C.',
      'Jedan od najbogatijih izvora vitamina C među uobičajenim povrćem.',
      'g', 'g', 20, 0.9, 0.2, 4.6, 1.7,
      '{"vitamin_c": {"amount": 80, "unit": "mg"}, "potassium": {"amount": 175, "unit": "mg"}}',
      '{"pcs": 120, "kom": 120}'
    ),
    (
      'red-onion', v_ing_cat_id, 'Red Onion', 'Crveni luk', 'Allium cepa',
      'Contains quercetin, a plant antioxidant found at higher levels in the red-skinned variety.',
      'Sadrži kvercetin, biljni antioksidans prisutan u većoj količini u crvenoj sorti luka.',
      'g', 'g', 40, 1.1, 0.1, 9.3, 1.7,
      '{"vitamin_c": {"amount": 7.4, "unit": "mg"}, "potassium": {"amount": 146, "unit": "mg"}}',
      '{"pcs": 70, "kom": 70}'
    ),
    (
      'pumpkin', v_ing_cat_id, 'Pumpkin', 'Bundeva', 'Cucurbita pepo',
      'Rich in beta-carotene, fiber and antioxidants.',
      'Bogata beta-karotenom, vlaknima i antioksidansima.',
      'g', 'g', 26, 1, 0.1, 6.5, 0.5,
      '{"vitamin_a": {"amount": 170, "unit": "µg"}, "potassium": {"amount": 340, "unit": "mg"}}',
      '{}'
    )
  on conflict (slug) do update set
    ingredient_category_id = excluded.ingredient_category_id,
    name_en = excluded.name_en, name_sr = excluded.name_sr, latin_name = excluded.latin_name,
    fact_en = excluded.fact_en, fact_sr = excluded.fact_sr,
    default_unit_en = excluded.default_unit_en, default_unit_sr = excluded.default_unit_sr,
    calories_kcal = excluded.calories_kcal, protein_g = excluded.protein_g, fat_g = excluded.fat_g,
    carbs_g = excluded.carbs_g, fiber_g = excluded.fiber_g,
    micronutrients = excluded.micronutrients, unit_conversions = excluded.unit_conversions;

  select id into v_ing_cat_id from ingredient_categories where slug = 'dairy';
  insert into ingredients (
    slug, ingredient_category_id, name_en, name_sr, latin_name,
    fact_en, fact_sr, default_unit_en, default_unit_sr,
    calories_kcal, protein_g, fat_g, carbs_g, fiber_g, micronutrients, unit_conversions
  ) values (
    'white-brined-cheese', v_ing_cat_id, 'White Brined Cheese', 'Beli sir', null,
    'A salty, crumbly cheese similar to feta, aged in brine.',
    'Slan, mrvičast sir sličan feti, zreo u salamuri.',
    'g', 'g', 264, 14, 21, 4.1, 0,
    '{"calcium": {"amount": 493, "unit": "mg"}}',
    '{}'
  )
  on conflict (slug) do update set
    ingredient_category_id = excluded.ingredient_category_id,
    name_en = excluded.name_en, name_sr = excluded.name_sr, latin_name = excluded.latin_name,
    fact_en = excluded.fact_en, fact_sr = excluded.fact_sr,
    default_unit_en = excluded.default_unit_en, default_unit_sr = excluded.default_unit_sr,
    calories_kcal = excluded.calories_kcal, protein_g = excluded.protein_g, fat_g = excluded.fat_g,
    carbs_g = excluded.carbs_g, fiber_g = excluded.fiber_g,
    micronutrients = excluded.micronutrients, unit_conversions = excluded.unit_conversions;

  select id into v_ing_cat_id from ingredient_categories where slug = 'oils-and-fats';
  insert into ingredients (
    slug, ingredient_category_id, name_en, name_sr, latin_name,
    fact_en, fact_sr, default_unit_en, default_unit_sr,
    calories_kcal, protein_g, fat_g, carbs_g, fiber_g, micronutrients, unit_conversions
  ) values (
    'olive-oil', v_ing_cat_id, 'Olive Oil', 'Maslinovo ulje', 'Olea europaea',
    'A source of monounsaturated fat and vitamin E, central to Mediterranean cooking.',
    'Izvor mononezasićenih masti i vitamina E, osnova mediteranske kuhinje.',
    'ml', 'ml', 884, 0, 100, 0, 0,
    '{"vitamin_e": {"amount": 14, "unit": "mg"}}',
    '{"tbsp": 14, "kašike": 14, "kašika": 14}'
  )
  on conflict (slug) do update set
    ingredient_category_id = excluded.ingredient_category_id,
    name_en = excluded.name_en, name_sr = excluded.name_sr, latin_name = excluded.latin_name,
    fact_en = excluded.fact_en, fact_sr = excluded.fact_sr,
    default_unit_en = excluded.default_unit_en, default_unit_sr = excluded.default_unit_sr,
    calories_kcal = excluded.calories_kcal, protein_g = excluded.protein_g, fat_g = excluded.fat_g,
    carbs_g = excluded.carbs_g, fiber_g = excluded.fiber_g,
    micronutrients = excluded.micronutrients, unit_conversions = excluded.unit_conversions;

end $$;

-- Link Šopska salata's ingredients to the catalog so the nutrition panel
-- has real data to auto-calculate from.

update recipe_ingredients set ingredient_id = (select id from ingredients where slug = 'tomato')
  where recipe_id = (select id from recipes where slug = 'sopska-salata') and order_index = 1;
update recipe_ingredients set ingredient_id = (select id from ingredients where slug = 'cucumber')
  where recipe_id = (select id from recipes where slug = 'sopska-salata') and order_index = 2;
update recipe_ingredients set ingredient_id = (select id from ingredients where slug = 'green-bell-pepper')
  where recipe_id = (select id from recipes where slug = 'sopska-salata') and order_index = 3;
update recipe_ingredients set ingredient_id = (select id from ingredients where slug = 'red-onion')
  where recipe_id = (select id from recipes where slug = 'sopska-salata') and order_index = 4;
update recipe_ingredients set ingredient_id = (select id from ingredients where slug = 'white-brined-cheese')
  where recipe_id = (select id from recipes where slug = 'sopska-salata') and order_index = 5;
update recipe_ingredients set ingredient_id = (select id from ingredients where slug = 'olive-oil')
  where recipe_id = (select id from recipes where slug = 'sopska-salata') and order_index = 6;

commit;

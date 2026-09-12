-- Phase 6: seed the "Predjela" (Appetizers) category, closing the gap noted
-- in DEVELOPMENT_PLAN.md, independent of the admin category CRUD UI.
insert into categories (slug, name_en, name_sr)
values ('predjela', 'Appetizers', 'Predjela')
on conflict (slug) do nothing;

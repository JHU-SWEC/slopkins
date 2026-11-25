-- Moves meal logging and ranking onto Supabase. Source of truth: docs/database-schema.md.
--
-- 1. Seeds the three halls and their Nutrislice menus (mirrors lib/halls.ts),
--    so meals can point at a hall and the log action can record menu_items.
-- 2. Adds dish_places: where each dish was last served, for "FFC · Grill" labels.
--
-- dishes and menu_items are written by the server (secret key) when someone
-- logs a meal, from data it fetches from Nutrislice itself.

-- ============================================================
-- Seed: dining halls and Nutrislice menus
-- ============================================================

insert into public.dining_halls (slug, name)
values
  ('ffc', 'FFC'),
  ('nolans', 'Nolan''s'),
  ('levering', 'Levering')
on conflict (slug) do nothing;

insert into public.nutrislice_menus (dining_hall_id, school_slug, menu_type_slug, meal, label)
select h.id, m.school_slug, m.menu_type_slug, m.meal::public.meal_type, m.label
from (
  values
    ('ffc', 'hopkins-cafe', 'hopkins-cafe-breakfast', 'breakfast', 'Breakfast'),
    ('ffc', 'hopkins-cafe', 'hopkins-cafe-lunch', 'lunch', 'Lunch'),
    ('ffc', 'hopkins-cafe', 'hopkins-cafe-dinner', 'dinner', 'Dinner'),
    ('nolans', 'nolans-on-33rd', 'nolans-breakfast', 'breakfast', 'Breakfast'),
    -- Nutrislice really calls Nolan's lunch "dinner-2".
    ('nolans', 'nolans-on-33rd', 'nolans-dinner-2', 'lunch', 'Lunch'),
    ('nolans', 'nolans-on-33rd', 'nolans-dinner', 'dinner', 'Dinner'),
    ('levering', 'site-1', 'butterfly', null, 'Taco Kitchen'),
    ('levering', 'site-1', 'mosaic-global-kitchen', null, 'Mosaic Global Kitchen'),
    ('levering', 'site-1', 'red-lantern-kitchen', null, 'Red Lantern Kitchen'),
    ('levering', 'site-1', 'tossed-kitchen', null, 'Tossed Kitchen')
) as m (hall_slug, school_slug, menu_type_slug, meal, label)
join public.dining_halls h on h.slug = m.hall_slug
on conflict (school_slug, menu_type_slug) do nothing;

-- ============================================================
-- dish_places: the latest hall and station each dish was served at
-- ============================================================

create view public.dish_places
with (security_invoker = true)
as
  select distinct on (mi.dish_id)
    mi.dish_id,
    h.slug as hall_slug,
    mi.station,
    mi.served_on
  from public.menu_items mi
  join public.nutrislice_menus nm on nm.id = mi.nutrislice_menu_id
  join public.dining_halls h on h.id = nm.dining_hall_id
  order by mi.dish_id, mi.served_on desc, mi.id desc;

revoke all on public.dish_places from anon, authenticated;
grant select on public.dish_places to anon, authenticated;

-- Meal photos: one optional photo per logged meal, shown on the feed.
--
-- 1. meals.photo_path holds the file's path in the "meal-photos" bucket,
--    e.g. "<user id>/1732600000000.jpg".
-- 2. The "meal-photos" bucket. The browser uploads straight to it (shrunk to
--    about 1600px first); users can only write inside their own folder.
-- 3. log_meal takes the photo path, so the meal and its photo are saved together.

-- ============================================================
-- meals.photo_path
-- ============================================================

alter table public.meals add column photo_path text;

-- Column-level insert grant from the meal logging migration, plus the new column.
grant insert (photo_path) on public.meals to authenticated;

-- ============================================================
-- Storage: "meal-photos" bucket
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos', 'meal-photos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "users upload their own meal photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete their own meal photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============================================================
-- log_meal: same as before, plus an optional photo
-- ============================================================

drop function public.log_meal(bigint, public.meal_type, bigint[], boolean);

create function public.log_meal(
  p_dining_hall_id bigint,
  p_meal public.meal_type,
  p_dish_ids bigint[],
  p_rank boolean default true,
  p_photo_path text default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_meal_id bigint;
begin
  if coalesce(cardinality(p_dish_ids), 0) = 0 then
    raise exception 'A meal needs at least one dish';
  end if;

  -- Only a photo in your own folder can go on your meal.
  if p_photo_path is not null
    and split_part(p_photo_path, '/', 1) <> (select auth.uid())::text then
    raise exception 'That photo belongs to someone else';
  end if;

  insert into public.meals (user_id, dining_hall_id, meal, photo_path)
  values ((select auth.uid()), p_dining_hall_id, p_meal, p_photo_path)
  returning id into v_meal_id;

  insert into public.meal_dishes (meal_id, dish_id, rank_status)
  select
    v_meal_id,
    d.id,
    case
      when not d.rankable then 'unrankable'::public.rank_status
      when p_rank then 'pending'::public.rank_status
      else 'skipped'::public.rank_status
    end
  from public.dishes d
  where d.id = any (p_dish_ids);

  return v_meal_id;
end;
$$;

revoke execute on function public.log_meal(bigint, public.meal_type, bigint[], boolean, text)
from public, anon;

grant execute on function public.log_meal(bigint, public.meal_type, bigint[], boolean, text)
to authenticated;

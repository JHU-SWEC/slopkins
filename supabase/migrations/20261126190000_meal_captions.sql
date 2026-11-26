-- Captions on meal posts: an optional note written when logging the meal,
-- shown on the post (feed and profile Activity). Up to 500 characters.

alter table public.meals
  add column caption text check (char_length(caption) <= 500);

-- Column-level insert grant, like photo_path.
grant insert (caption) on public.meals to authenticated;

-- log_meal takes the caption, so the meal is saved in one go. Same as the
-- plate rankings version otherwise (every dish starts in the queue).
drop function public.log_meal(bigint, public.meal_type, bigint[], boolean, text);

create function public.log_meal(
  p_dining_hall_id bigint,
  p_meal public.meal_type,
  p_dish_ids bigint[],
  p_rank boolean default true,
  p_photo_path text default null,
  p_caption text default null
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

  insert into public.meals (user_id, dining_hall_id, meal, photo_path, caption)
  values (
    (select auth.uid()), p_dining_hall_id, p_meal, p_photo_path,
    nullif(btrim(p_caption), '')
  )
  returning id into v_meal_id;

  insert into public.meal_dishes (meal_id, dish_id, rank_status)
  select
    v_meal_id,
    d.id,
    case when p_rank then 'pending'::public.rank_status else 'skipped'::public.rank_status end
  from public.dishes d
  where d.id = any (p_dish_ids);

  return v_meal_id;
end;
$$;

revoke execute on function public.log_meal(bigint, public.meal_type, bigint[], boolean, text, text)
from public, anon;

grant execute on function public.log_meal(bigint, public.meal_type, bigint[], boolean, text, text)
to authenticated;

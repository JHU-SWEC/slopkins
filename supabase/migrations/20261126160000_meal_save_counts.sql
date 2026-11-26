-- How many people saved each post to their Want to Try list. saved_plates
-- stays private (you can only read your own rows), so this function runs as
-- the table owner and returns only a number per post, never who saved it.
-- Deleted posts are skipped, same as everywhere else.

create function public.meal_save_counts(p_meal_ids bigint[])
returns table (meal_id bigint, saves bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select sp.meal_id, count(*)
  from public.saved_plates sp
  join public.meals m on m.id = sp.meal_id and m.deleted_at is null
  where sp.meal_id = any (p_meal_ids)
  group by sp.meal_id;
$$;

revoke execute on function public.meal_save_counts(bigint[]) from public;
grant execute on function public.meal_save_counts(bigint[]) to anon, authenticated;

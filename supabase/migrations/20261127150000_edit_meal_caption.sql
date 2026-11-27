-- Editing a post's notes (meals.caption) after it's posted.
--
-- Users can't update meals directly (no update grant), so, like
-- soft_delete_meal and remove_meal_photo, this function is the only way in.
-- It runs as the table owner and checks the caller owns the meal.
-- Blank notes are saved as null (no notes). The 500-character limit is the
-- column's check constraint.

create function public.set_meal_caption(p_meal_id bigint, p_caption text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.meals
  set caption = nullif(btrim(p_caption), '')
  where id = p_meal_id
    and user_id = (select auth.uid())
    and deleted_at is null;
  if not found then
    raise exception 'Meal not found';
  end if;
end;
$$;

revoke execute on function public.set_meal_caption(bigint, text) from public, anon;
grant execute on function public.set_meal_caption(bigint, text) to authenticated;

-- Soft deletion for meal posts and their photos. Nothing is removed: rows and
-- photo files stay, so a post can be restored from the dashboard by clearing
-- the timestamp.
--
-- deleted_at:       the whole post is hidden everywhere (feed, Activity,
--                   rank queue). Rankings made from it stay on your list.
-- photo_deleted_at: just the photo is hidden; the post stays.

alter table public.meals
  add column deleted_at timestamptz,
  add column photo_deleted_at timestamptz;

-- Deleted posts disappear for everyone, owner included.
drop policy "meals are readable by everyone" on public.meals;
create policy "meals are readable by everyone" on public.meals
  for select to anon, authenticated
  using (deleted_at is null);

-- Users can't update meals directly (no update grant), so these two functions
-- are the only way to set the timestamps. They run as the owner of the table
-- to get past the select policy above, and check the caller owns the meal.

create function public.soft_delete_meal(p_meal_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.meals
  set deleted_at = now()
  where id = p_meal_id
    and user_id = (select auth.uid())
    and deleted_at is null;
  if not found then
    raise exception 'Meal not found';
  end if;
end;
$$;

create function public.remove_meal_photo(p_meal_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.meals
  set photo_deleted_at = now()
  where id = p_meal_id
    and user_id = (select auth.uid())
    and deleted_at is null
    and photo_path is not null
    and photo_deleted_at is null;
  if not found then
    raise exception 'Photo not found';
  end if;
end;
$$;

revoke execute on function public.soft_delete_meal(bigint), public.remove_meal_photo(bigint)
from public, anon;

grant execute on function public.soft_delete_meal(bigint), public.remove_meal_photo(bigint)
to authenticated;

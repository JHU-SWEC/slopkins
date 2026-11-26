-- Comments on feed posts, and saving someone else's plate to Want to Try.
--
-- meal_comments: one row per comment. Soft deleted (deleted_at) by the
--   comment's author or the post's owner, through soft_delete_comment.
-- saved_plates: a copy of another person's meal (hall, meal, dish ids) on
--   your Want to Try list. The dish ids are copied so the plate stays saved
--   even if the poster deletes their post. Private, like dish_alerts.

-- ============================================================
-- meal_comments
-- ============================================================

create table public.meal_comments (
  id bigint generated always as identity primary key,
  meal_id bigint not null references public.meals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index meal_comments_meal_id_created_at_idx on public.meal_comments (meal_id, created_at);

alter table public.meal_comments enable row level security;

revoke all on public.meal_comments from anon, authenticated;
grant select on public.meal_comments to anon, authenticated;
grant insert (meal_id, user_id, body) on public.meal_comments to authenticated;

-- The meals select policy hides soft-deleted meals, so these subqueries also
-- hide comments on deleted posts and block commenting on them.
create policy "comments on visible meals are readable by everyone" on public.meal_comments
  for select to anon, authenticated
  using (
    deleted_at is null
    and exists (select 1 from public.meals m where m.id = meal_id)
  );

create policy "users comment as themselves" on public.meal_comments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.meals m where m.id = meal_id)
  );

-- Users can't update comments directly (no update grant); this is the only way
-- to hide one. Allowed for the comment's author and the post's owner.
create function public.soft_delete_comment(p_comment_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.meal_comments c
  set deleted_at = now()
  from public.meals m
  where c.id = p_comment_id
    and m.id = c.meal_id
    and c.deleted_at is null
    and (select auth.uid()) in (c.user_id, m.user_id);
  if not found then
    raise exception 'Comment not found';
  end if;
end;
$$;

revoke execute on function public.soft_delete_comment(bigint) from public, anon;
grant execute on function public.soft_delete_comment(bigint) to authenticated;

-- ============================================================
-- saved_plates
-- ============================================================

create table public.saved_plates (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- The post it was saved from, for credit. Null once that meal is gone.
  meal_id bigint references public.meals (id) on delete set null,
  dining_hall_id bigint not null references public.dining_halls (id),
  meal public.meal_type,
  dish_ids bigint[] not null check (cardinality(dish_ids) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, meal_id)
);

create index saved_plates_user_id_created_at_idx on public.saved_plates (user_id, created_at desc);

alter table public.saved_plates enable row level security;

revoke all on public.saved_plates from anon, authenticated;
grant select, delete on public.saved_plates to authenticated;
grant insert (user_id, meal_id, dining_hall_id, meal, dish_ids) on public.saved_plates to authenticated;

create policy "users read their own saved plates" on public.saved_plates
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users save plates as themselves" on public.saved_plates
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users remove their own saved plates" on public.saved_plates
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Likes on feed posts (logged meals). One row per person per meal; liking is
-- inserting a row, unliking is deleting it. Shown as a count on the feed and as
-- "liked your meal" on the poster's Activity page.

create table public.meal_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  meal_id bigint not null references public.meals (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meal_id)
);

create index meal_likes_meal_id_idx on public.meal_likes (meal_id);

alter table public.meal_likes enable row level security;

revoke all on public.meal_likes from anon, authenticated;
grant select on public.meal_likes to anon, authenticated;
grant insert (user_id, meal_id), delete on public.meal_likes to authenticated;

-- The meals select policy hides soft-deleted meals, so these subqueries also
-- hide likes on deleted posts and block liking them.
create policy "likes on visible meals are readable by everyone" on public.meal_likes
  for select to anon, authenticated
  using (exists (select 1 from public.meals m where m.id = meal_id));

create policy "users like as themselves" on public.meal_likes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.meals m where m.id = meal_id)
  );

create policy "users remove their own likes" on public.meal_likes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

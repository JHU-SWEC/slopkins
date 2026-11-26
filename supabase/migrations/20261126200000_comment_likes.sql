-- Likes on comments under feed posts. One row per person per comment; liking
-- is inserting a row, unliking is deleting it. Same shape as meal_likes.

create table public.comment_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment_id bigint not null references public.meal_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create index comment_likes_comment_id_idx on public.comment_likes (comment_id);

alter table public.comment_likes enable row level security;

revoke all on public.comment_likes from anon, authenticated;
grant select on public.comment_likes to anon, authenticated;
grant insert (user_id, comment_id), delete on public.comment_likes to authenticated;

-- The meal_comments select policy hides deleted comments and comments on
-- deleted posts, so these subqueries hide their likes and block liking them.
create policy "likes on visible comments are readable by everyone" on public.comment_likes
  for select to anon, authenticated
  using (exists (select 1 from public.meal_comments c where c.id = comment_id));

create policy "users like comments as themselves" on public.comment_likes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.meal_comments c where c.id = comment_id)
  );

create policy "users remove their own comment likes" on public.comment_likes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

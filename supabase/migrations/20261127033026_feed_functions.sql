-- The feed and the profile Posts tab in one database call each, instead of
-- five requests one after another from the server (features/feed/queries.ts).
-- The functions return the posts as JSON, already shaped like FeedPost.
--
-- security invoker: they run as the caller, so every table's RLS still applies
-- exactly as it did for the separate requests (deleted meals and comments stay
-- hidden). The viewer is auth.uid(), never an argument, so nobody can ask for
-- someone else's likes or saves.

-- Newest posts by these people, as the signed-in viewer sees them (or signed
-- out: no likes or saves of your own, and viewer is null).
create or replace function public.get_posts(p_author_ids uuid[], p_limit int default 30)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (select (select auth.uid()) as id),
  page as (
    select m.id, m.user_id, m.dining_hall_id, m.meal, m.photo_path, m.photo_deleted_at, m.caption, m.created_at
    from public.meals m
    where m.user_id = any (p_author_ids)
    order by m.created_at desc
    limit least(greatest(p_limit, 1), 100)
  ),
  saves as (
    select s.meal_id, s.saves from public.meal_save_counts(array(select id from page)) s
  )
  select jsonb_build_object(
    'viewer', (
      select jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url)
      from public.profiles p, me where p.id = me.id
    ),
    'posts', coalesce((
      select jsonb_agg(t.post order by t.created_at desc)
      from (
        select pg.created_at, jsonb_build_object(
          'id', pg.id,
          'at', pg.created_at,
          'person', jsonb_build_object('id', author.id, 'username', author.username, 'display_name', author.display_name, 'avatar_url', author.avatar_url),
          'hall', (select jsonb_build_object('slug', h.slug, 'name', h.name) from public.dining_halls h where h.id = pg.dining_hall_id),
          'meal', pg.meal,
          -- A removed photo stays in storage but isn't shown.
          'photoPath', case when pg.photo_deleted_at is null then pg.photo_path end,
          'caption', pg.caption,
          'dishes', coalesce((
            select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name))
            from public.meal_dishes md join public.dishes d on d.id = md.dish_id
            where md.meal_id = pg.id
          ), '[]'::jsonb),
          -- The poster's score for the plate, and its spot on their list:
          -- 1 + how many of their visible plates sort ahead of it (higher
          -- score, or the same score and an older meal id).
          'ranking', (
            select jsonb_build_object(
              'score', pr.score,
              'sentiment', pr.sentiment,
              'comment', pr.comment,
              'rank', 1 + (
                select count(*)
                from public.plate_rankings o
                join public.meals om on om.id = o.meal_id
                where o.user_id = pr.user_id
                  and (o.score > pr.score or (o.score = pr.score and o.meal_id < pr.meal_id))
              )
            )
            from public.plate_rankings pr where pr.meal_id = pg.id
          ),
          'likes', (select count(*) from public.meal_likes l where l.meal_id = pg.id),
          'likedByMe', exists (select 1 from public.meal_likes l, me where l.meal_id = pg.id and l.user_id = me.id),
          'saves', coalesce((select s.saves from saves s where s.meal_id = pg.id), 0),
          'savedByMe', exists (select 1 from public.saved_plates sp, me where sp.meal_id = pg.id and sp.user_id = me.id),
          -- Oldest first.
          'comments', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', c.id,
              'at', c.created_at,
              'body', c.body,
              'person', jsonb_build_object('id', cp.id, 'username', cp.username, 'display_name', cp.display_name, 'avatar_url', cp.avatar_url),
              'likes', (select count(*) from public.comment_likes cl where cl.comment_id = c.id),
              'likedByMe', exists (select 1 from public.comment_likes cl, me where cl.comment_id = c.id and cl.user_id = me.id)
            ) order by c.created_at)
            from public.meal_comments c
            join public.profiles cp on cp.id = c.user_id
            where c.meal_id = pg.id
          ), '[]'::jsonb)
        ) as post
        from page pg
        join public.profiles author on author.id = pg.user_id
      ) t
    ), '[]'::jsonb)
  );
$$;

-- The signed-in viewer's feed: their own meals and the people they follow.
-- Null when signed out.
create or replace function public.get_feed(p_limit int default 30)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select public.get_posts(
    array[(select auth.uid())] || array(select f.followee_id from public.follows f where f.follower_id = (select auth.uid())),
    p_limit
  )
  where (select auth.uid()) is not null;
$$;

revoke all on function public.get_posts(uuid[], int) from public;
revoke all on function public.get_feed(int) from public;
grant execute on function public.get_posts(uuid[], int) to anon, authenticated;
grant execute on function public.get_feed(int) to authenticated;

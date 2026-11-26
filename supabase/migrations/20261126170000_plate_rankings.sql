-- Plate rankings: a logged meal is ranked as a whole, instead of dish by dish.
--
-- Same Beli-style flow as rank_dish: pick a sentiment, binary-search that
-- sentiment group with "which plate was better?", and send the position.
-- Scores use the same bands as dishes (sentiment_score), so ordering a user's
-- plates by score desc gives their list.
--
-- Every plate can be ranked, sides and all (log_meal below), and a dish's
-- score is the average of every ranked plate it was on (dish_scores below).
--
-- The old per-dish tables (rankings, comparisons) and rank_dish stay, with
-- their data; the app just stops writing to them.

create table public.plate_rankings (
  meal_id bigint primary key references public.meals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sentiment public.sentiment not null,
  score numeric not null,
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plate_rankings_score_in_sentiment_band check (
    case sentiment
      when 'liked' then score > 7 and score <= 10
      when 'fine' then score > 4 and score <= 7
      else score > 0 and score <= 4
    end
  )
);

create index plate_rankings_user_id_score_idx on public.plate_rankings (user_id, score desc);

alter table public.plate_rankings enable row level security;

-- Public like meals: the feed and profiles show plate scores.
create policy "plate rankings are readable by everyone" on public.plate_rankings
  for select to anon, authenticated
  using (true);

-- No direct writes; rank_plate below is the only way in.
revoke all on public.plate_rankings from anon, authenticated;
grant select on public.plate_rankings to anon, authenticated;

-- Places one of your plates on your list.
-- p_position: 0-based index in the sentiment group, not counting this plate.
-- Re-ranking a plate moves it. Scores in every touched group are re-spread.
-- Plates whose posts were deleted are left out of the groups.
-- Runs as the table owner (users can't write plate_rankings directly), so it
-- checks the meal is the caller's own.
create function public.rank_plate(
  p_meal_id bigint,
  p_sentiment public.sentiment,
  p_position int,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_old_sentiment public.sentiment;
  v_ids bigint[];
begin
  if v_user_id is null then
    raise exception 'Not signed in';
  end if;

  if not exists (
    select 1 from public.meals
    where id = p_meal_id and user_id = v_user_id and deleted_at is null
  ) then
    raise exception 'Meal not found';
  end if;

  select sentiment into v_old_sentiment
  from public.plate_rankings
  where meal_id = p_meal_id;

  -- The group as it stands, best first, without this plate.
  select coalesce(array_agg(pr.meal_id order by pr.score desc), '{}')
  into v_ids
  from public.plate_rankings pr
  join public.meals m on m.id = pr.meal_id
  where pr.user_id = v_user_id
    and pr.sentiment = p_sentiment
    and pr.meal_id <> p_meal_id
    and m.deleted_at is null;

  if p_position < 0 or p_position > cardinality(v_ids) then
    raise exception 'Position % is outside a group of %', p_position, cardinality(v_ids);
  end if;

  v_ids := v_ids[1:p_position] || p_meal_id || v_ids[p_position + 1:];

  -- Temporary score at the top of the band; re-spread below.
  insert into public.plate_rankings (meal_id, user_id, sentiment, score, comment)
  values (p_meal_id, v_user_id, p_sentiment, public.sentiment_score(p_sentiment, 0, 1), p_comment)
  on conflict (meal_id) do update
  set sentiment = excluded.sentiment,
      score = excluded.score,
      comment = coalesce(excluded.comment, public.plate_rankings.comment),
      updated_at = now();

  update public.plate_rankings r
  set score = public.sentiment_score(p_sentiment, (u.ord - 1)::int, cardinality(v_ids))
  from unnest(v_ids) with ordinality as u (meal_id, ord)
  where r.meal_id = u.meal_id;

  -- The plate left its old group: close the gap.
  if v_old_sentiment is not null and v_old_sentiment <> p_sentiment then
    update public.plate_rankings r
    set score = public.sentiment_score(v_old_sentiment, (g.ord - 1)::int, g.n::int)
    from (
      select
        pr.meal_id,
        row_number() over (order by pr.score desc) as ord,
        count(*) over () as n
      from public.plate_rankings pr
      join public.meals m on m.id = pr.meal_id
      where pr.user_id = v_user_id
        and pr.sentiment = v_old_sentiment
        and m.deleted_at is null
    ) as g
    where r.meal_id = g.meal_id;
  end if;

  -- The plate is done: nothing in it is waiting in the rank queue anymore.
  -- Includes 'unrankable' rows on meals logged before plates could have sides.
  update public.meal_dishes
  set rank_status = 'ranked'
  where meal_id = p_meal_id and rank_status <> 'ranked';
end;
$$;

revoke execute on function public.rank_plate(bigint, public.sentiment, int, text) from public, anon;
grant execute on function public.rank_plate(bigint, public.sentiment, int, text) to authenticated;

-- profile_rank now counts plates ranked instead of dishes. The column keeps
-- its old name (dishes_ranked) so the function's signature doesn't change.
create or replace function public.profile_rank(target uuid)
returns table (dishes_ranked int, rank int, total_users int)
language sql
stable
security invoker
set search_path = ''
as $$
  with counts as (
    select p.id, count(m.id) as n
    from public.profiles p
    left join public.plate_rankings pr on pr.user_id = p.id
    -- meals RLS hides deleted posts, so their plates don't count.
    left join public.meals m on m.id = pr.meal_id
    group by p.id
  ),
  me as (
    select coalesce((select n from counts where id = target), 0) as n
  )
  select
    (select n from me)::int,
    (1 + (select count(*) from counts where n > (select n from me)))::int,
    (select count(*) from counts)::int;
$$;

-- ============================================================
-- log_meal: every dish starts in the queue, mains or not
-- ============================================================

-- Same as the meal photos version, minus the 'unrankable' case: the plate is
-- ranked as a whole, so a plate of only sides can be ranked too.
create or replace function public.log_meal(
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
    case when p_rank then 'pending'::public.rank_status else 'skipped'::public.rank_status end
  from public.dishes d
  where d.id = any (p_dish_ids);

  return v_meal_id;
end;
$$;

-- ============================================================
-- dish_scores: average of every ranked plate the dish was on
-- ============================================================

-- Same columns as before so nothing that reads it breaks; num_rankings now
-- counts plates. Every dish counts (sides too), across all users. Deleted
-- posts drop out (meals RLS, since the view is security invoker).
create or replace view public.dish_scores
with (security_invoker = true)
as
  select
    md.dish_id,
    avg(pr.score) as avg_score,
    count(*)::int as num_rankings
  from public.plate_rankings pr
  join public.meals m on m.id = pr.meal_id
  join public.meal_dishes md on md.meal_id = pr.meal_id
  group by md.dish_id;

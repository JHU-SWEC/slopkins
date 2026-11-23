-- Meal logging + ranking pipeline. Source of truth: docs/database-schema.md.
--
-- Flow: a user logs a meal (meals + meal_dishes), then ranks the meal's
-- rankable dishes one at a time with rank_dish(). Any dish can be skipped,
-- and "log without ranking" marks every dish skipped up front.

create type public.sentiment as enum ('liked', 'fine', 'disliked');

-- Where a logged dish stands in the rank queue.
--   pending     waiting to be ranked
--   ranked      rank_dish() ran for it (or the user kept an existing ranking)
--   skipped     the user chose not to rank it
--   unrankable  dishes.rankable was false when it was logged
create type public.rank_status as enum ('pending', 'ranked', 'skipped', 'unrankable');

-- ============================================================
-- Dishes: rankable flag
-- ============================================================

-- Sides, staples and condiments (rice, steamed vegetables, build-your-own
-- bars) can be logged but not ranked. The ingest sets this; defaults to true.
alter table public.dishes add column rankable boolean not null default true;

-- ============================================================
-- Meals
-- ============================================================

create table public.meals (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  dining_hall_id bigint not null references public.dining_halls (id),
  -- Null for Levering kitchens, which have no meal.
  meal public.meal_type,
  eaten_on date not null default (now() at time zone 'America/New_York')::date,
  created_at timestamptz not null default now()
);

create index meals_user_id_created_at_idx on public.meals (user_id, created_at desc);
create index meals_dining_hall_id_idx on public.meals (dining_hall_id);

create table public.meal_dishes (
  meal_id bigint not null references public.meals (id) on delete cascade,
  dish_id bigint not null references public.dishes (id),
  rank_status public.rank_status not null default 'pending',
  primary key (meal_id, dish_id)
);

create index meal_dishes_dish_id_idx on public.meal_dishes (dish_id);

-- ============================================================
-- Rankings: sentiment bands
-- ============================================================

-- Each sentiment owns a score band, so a disliked dish never outscores a
-- liked one. Within a band, dishes are spread evenly by rank.
--   liked     (7, 10]
--   fine      (4, 7]
--   disliked  (0, 4]
alter table public.rankings add column sentiment public.sentiment;

update public.rankings
set sentiment = case
  when score > 7 then 'liked'::public.sentiment
  when score > 4 then 'fine'::public.sentiment
  else 'disliked'::public.sentiment
end;

alter table public.rankings alter column sentiment set not null;

alter table public.rankings add constraint rankings_score_in_sentiment_band check (
  case sentiment
    when 'liked' then score > 7 and score <= 10
    when 'fine' then score > 4 and score <= 7
    else score > 0 and score <= 4
  end
);

-- Score for the dish at `position` (0 = best) in a sentiment group of
-- `group_size`. Mirrored in features/ranking/score.ts.
create function public.sentiment_score(
  p_sentiment public.sentiment,
  p_position int,
  p_group_size int
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case p_sentiment
    when 'liked' then 10 - 3 * p_position::numeric / p_group_size
    when 'fine' then 7 - 3 * p_position::numeric / p_group_size
    else 4 - 4 * p_position::numeric / p_group_size
  end;
$$;

-- ============================================================
-- RPCs
-- ============================================================

-- Logs a meal and its dishes in one transaction. Returns the meal id.
-- p_rank = false is "log without ranking": rankable dishes start skipped.
create function public.log_meal(
  p_dining_hall_id bigint,
  p_meal public.meal_type,
  p_dish_ids bigint[],
  p_rank boolean default true
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

  insert into public.meals (user_id, dining_hall_id, meal)
  values ((select auth.uid()), p_dining_hall_id, p_meal)
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

-- Places a dish on the caller's list, Beli-style: the client picks a
-- sentiment, binary-searches the sentiment group with "which is better?"
-- questions, and sends the resulting position plus the answers.
--
-- p_position: 0-based index in the sentiment group, not counting this dish.
-- p_comparisons: [{"winner_dish_id": 1, "loser_dish_id": 2}, ...]
-- p_meal_id: marks that meal's row for this dish as ranked.
--
-- Re-ranking a dish already on the list moves it. Scores in every touched
-- group are re-spread so the list order and dish_scores stay consistent.
create function public.rank_dish(
  p_dish_id bigint,
  p_sentiment public.sentiment,
  p_position int,
  p_comment text default null,
  p_meal_id bigint default null,
  p_comparisons jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
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

  if not coalesce((select rankable from public.dishes where id = p_dish_id), false) then
    raise exception 'Dish % is not rankable', p_dish_id;
  end if;

  insert into public.comparisons (user_id, winner_dish_id, loser_dish_id)
  select v_user_id, (c ->> 'winner_dish_id')::bigint, (c ->> 'loser_dish_id')::bigint
  from jsonb_array_elements(p_comparisons) as c;

  select sentiment into v_old_sentiment
  from public.rankings
  where user_id = v_user_id and dish_id = p_dish_id;

  -- The group as it stands, best first, without this dish.
  select coalesce(array_agg(dish_id order by score desc), '{}')
  into v_ids
  from public.rankings
  where user_id = v_user_id and sentiment = p_sentiment and dish_id <> p_dish_id;

  if p_position < 0 or p_position > cardinality(v_ids) then
    raise exception 'Position % is outside a group of %', p_position, cardinality(v_ids);
  end if;

  v_ids := v_ids[1:p_position] || p_dish_id || v_ids[p_position + 1:];

  -- Temporary score at the top of the band; re-spread below.
  insert into public.rankings (user_id, dish_id, sentiment, score, comment)
  values (v_user_id, p_dish_id, p_sentiment, public.sentiment_score(p_sentiment, 0, 1), p_comment)
  on conflict (user_id, dish_id) do update
  set sentiment = excluded.sentiment,
      score = excluded.score,
      comment = coalesce(excluded.comment, public.rankings.comment);

  update public.rankings r
  set score = public.sentiment_score(p_sentiment, (u.ord - 1)::int, cardinality(v_ids))
  from unnest(v_ids) with ordinality as u (dish_id, ord)
  where r.user_id = v_user_id and r.dish_id = u.dish_id;

  -- The dish left its old group: close the gap.
  if v_old_sentiment is not null and v_old_sentiment <> p_sentiment then
    update public.rankings r
    set score = public.sentiment_score(v_old_sentiment, (g.ord - 1)::int, g.n::int)
    from (
      select
        dish_id,
        row_number() over (order by score desc) as ord,
        count(*) over () as n
      from public.rankings
      where user_id = v_user_id and sentiment = v_old_sentiment
    ) as g
    where r.user_id = v_user_id and r.dish_id = g.dish_id;
  end if;

  if p_meal_id is not null then
    update public.meal_dishes
    set rank_status = 'ranked'
    where meal_id = p_meal_id and dish_id = p_dish_id;
  end if;
end;
$$;

-- ============================================================
-- Privileges
-- ============================================================

revoke all on public.meals, public.meal_dishes from anon, authenticated;
grant select on public.meals, public.meal_dishes to anon, authenticated;

grant insert (user_id, dining_hall_id, meal, eaten_on), delete on public.meals to authenticated;
grant insert (meal_id, dish_id, rank_status), update (rank_status), delete on public.meal_dishes to authenticated;

-- Re-grant rankings with the new column.
revoke insert, update on public.rankings from authenticated;
grant insert (user_id, dish_id, sentiment, score, comment), update (sentiment, score, comment) on public.rankings to authenticated;

revoke execute on function
  public.sentiment_score(public.sentiment, int, int),
  public.log_meal(bigint, public.meal_type, bigint[], boolean),
  public.rank_dish(bigint, public.sentiment, int, text, bigint, jsonb)
from public, anon;

grant execute on function
  public.sentiment_score(public.sentiment, int, int),
  public.log_meal(bigint, public.meal_type, bigint[], boolean),
  public.rank_dish(bigint, public.sentiment, int, text, bigint, jsonb)
to authenticated;

-- ============================================================
-- RLS
-- ============================================================

alter table public.meals enable row level security;
alter table public.meal_dishes enable row level security;

-- meals: public like rankings, since the feed shows them.
create policy "meals are readable by everyone" on public.meals
  for select to anon, authenticated
  using (true);

create policy "users log their own meals" on public.meals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users delete their own meals" on public.meals
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- meal_dishes: ownership comes from the parent meal.
create policy "meal dishes are readable by everyone" on public.meal_dishes
  for select to anon, authenticated
  using (true);

create policy "users add dishes to their own meals" on public.meal_dishes
  for insert to authenticated
  with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  );

create policy "users update dishes on their own meals" on public.meal_dishes
  for update to authenticated
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  );

create policy "users delete dishes from their own meals" on public.meal_dishes
  for delete to authenticated
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  );

-- Initial schema. Source of truth: docs/database-schema.md.

create schema if not exists private;

create type public.meal_type as enum ('breakfast', 'lunch', 'dinner');

-- Keeps updated_at current on row updates.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

-- ============================================================
-- Auth + Profile + Social
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (btrim(username) <> ''),
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Creates a profile for every new auth user. The placeholder username is
-- unique; users change it later.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || left(replace(new.id::text, '-', ''), 12));
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_id_idx on public.follows (followee_id);

-- ============================================================
-- Dining
-- ============================================================

create table public.dining_halls (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null
);

create table public.nutrislice_menus (
  id bigint generated always as identity primary key,
  dining_hall_id bigint not null references public.dining_halls (id),
  school_slug text not null,
  menu_type_slug text not null,
  meal public.meal_type,
  label text not null,
  unique (school_slug, menu_type_slug)
);

create index nutrislice_menus_dining_hall_id_idx on public.nutrislice_menus (dining_hall_id);

create table public.dishes (
  id bigint generated always as identity primary key,
  nutrislice_food_id bigint not null unique,
  name text not null,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  serving_size text,
  dietary_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id bigint generated always as identity primary key,
  nutrislice_menu_id bigint not null references public.nutrislice_menus (id),
  dish_id bigint not null references public.dishes (id),
  served_on date not null,
  station text,
  unique (nutrislice_menu_id, dish_id, served_on)
);

create index menu_items_nutrislice_menu_id_served_on_idx on public.menu_items (nutrislice_menu_id, served_on);
create index menu_items_dish_id_idx on public.menu_items (dish_id);

create table public.dish_alerts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dish_id bigint not null references public.dishes (id),
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

create index dish_alerts_dish_id_idx on public.dish_alerts (dish_id);

-- ============================================================
-- Add + Rank
-- ============================================================

create table public.comparisons (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  winner_dish_id bigint not null references public.dishes (id),
  loser_dish_id bigint not null references public.dishes (id),
  created_at timestamptz not null default now(),
  check (winner_dish_id <> loser_dish_id)
);

create index comparisons_user_id_idx on public.comparisons (user_id);
create index comparisons_winner_dish_id_idx on public.comparisons (winner_dish_id);
create index comparisons_loser_dish_id_idx on public.comparisons (loser_dish_id);

create table public.rankings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dish_id bigint not null references public.dishes (id),
  -- numeric accepts 'NaN' and 'Infinity'; NaN fails both comparisons.
  score numeric not null check (score > '-Infinity'::numeric and score < 'Infinity'::numeric),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

create index rankings_user_id_score_idx on public.rankings (user_id, score desc);
create index rankings_dish_id_idx on public.rankings (dish_id);

create trigger rankings_set_updated_at
  before update on public.rankings
  for each row execute function private.set_updated_at();

create view public.dish_scores
with (security_invoker = true)
as
  select
    dish_id,
    avg(score) as avg_score,
    count(*)::int as num_rankings
  from public.rankings
  group by dish_id;

-- ============================================================
-- Privileges
-- ============================================================

revoke all on
  public.profiles, public.follows,
  public.dining_halls, public.nutrislice_menus, public.dishes, public.menu_items, public.dish_alerts,
  public.comparisons, public.rankings, public.dish_scores
from anon, authenticated;

grant select on
  public.profiles, public.follows,
  public.dining_halls, public.nutrislice_menus, public.dishes, public.menu_items,
  public.rankings, public.dish_scores
to anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

-- Column-level grants so clients can't set ids or timestamps.
grant update (username, display_name, avatar_url) on public.profiles to authenticated;
grant insert (follower_id, followee_id), delete on public.follows to authenticated;
grant select, insert (user_id, dish_id), delete on public.dish_alerts to authenticated;
grant select, insert (user_id, winner_dish_id, loser_dish_id) on public.comparisons to authenticated;
grant insert (user_id, dish_id, score, comment), update (score, comment), delete on public.rankings to authenticated;

-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.dining_halls enable row level security;
alter table public.nutrislice_menus enable row level security;
alter table public.dishes enable row level security;
alter table public.menu_items enable row level security;
alter table public.dish_alerts enable row level security;
alter table public.comparisons enable row level security;
alter table public.rankings enable row level security;

-- profiles
create policy "profiles are readable by everyone" on public.profiles
  for select to anon, authenticated
  using (true);

create policy "users update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- follows
create policy "follows are readable by everyone" on public.follows
  for select to anon, authenticated
  using (true);

create policy "users follow as themselves" on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id);

create policy "users unfollow as themselves" on public.follows
  for delete to authenticated
  using ((select auth.uid()) = follower_id);

-- dining data: read-only for clients, written by the ingest job (service role)
create policy "dining halls are readable by everyone" on public.dining_halls
  for select to anon, authenticated
  using (true);

create policy "nutrislice menus are readable by everyone" on public.nutrislice_menus
  for select to anon, authenticated
  using (true);

create policy "dishes are readable by everyone" on public.dishes
  for select to anon, authenticated
  using (true);

create policy "menu items are readable by everyone" on public.menu_items
  for select to anon, authenticated
  using (true);

-- dish_alerts
create policy "users read their own alerts" on public.dish_alerts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users create their own alerts" on public.dish_alerts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users delete their own alerts" on public.dish_alerts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- comparisons
create policy "users read their own comparisons" on public.comparisons
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users create their own comparisons" on public.comparisons
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- rankings
create policy "rankings are readable by everyone" on public.rankings
  for select to anon, authenticated
  using (true);

create policy "users create their own rankings" on public.rankings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users update their own rankings" on public.rankings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users delete their own rankings" on public.rankings
  for delete to authenticated
  using ((select auth.uid()) = user_id);

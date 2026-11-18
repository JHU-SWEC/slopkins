-- Profile page additions (owner: Auth + Profile + Social).
-- Builds on 20261106005115_initial_schema.sql. See docs/database-schema.md.

-- ============================================================
-- profiles: details the user fills in themselves
-- ============================================================

alter table public.profiles
  add column grade text
    check (grade in ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other')),
  add column major text check (char_length(major) <= 80),
  add column bio text check (char_length(bio) <= 300);

-- Usernames: 3-20 lowercase letters, numbers, or _. The placeholder
-- usernames from handle_new_user ("user_" + 12 hex) already fit.
-- "not valid" skips re-checking existing rows; new and edited rows are checked.
alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$') not valid;

alter table public.profiles
  add constraint profiles_display_name_length check (char_length(display_name) <= 50) not valid;

grant update (grade, major, bio) on public.profiles to authenticated;

-- ============================================================
-- user_dining_halls: halls a user has been to or wants to try
-- ============================================================

create table public.user_dining_halls (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dining_hall_id bigint not null references public.dining_halls (id) on delete cascade,
  status text not null check (status in ('visited', 'want_to_go')),
  created_at timestamptz not null default now(),
  primary key (user_id, dining_hall_id, status)
);

create index user_dining_halls_dining_hall_id_idx on public.user_dining_halls (dining_hall_id);

revoke all on public.user_dining_halls from anon, authenticated;
grant select on public.user_dining_halls to anon, authenticated;
grant insert (user_id, dining_hall_id, status), delete on public.user_dining_halls to authenticated;

alter table public.user_dining_halls enable row level security;

create policy "user dining halls are readable by everyone" on public.user_dining_halls
  for select to anon, authenticated
  using (true);

create policy "users add their own dining halls" on public.user_dining_halls
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users remove their own dining halls" on public.user_dining_halls
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- profile_rank: a user's place on Slopkins by number of dishes ranked.
-- 1 = most dishes ranked. Ties share a place.
-- ============================================================

create function public.profile_rank(target uuid)
returns table (dishes_ranked int, rank int, total_users int)
language sql
stable
security invoker
set search_path = ''
as $$
  with counts as (
    select p.id, count(r.dish_id) as n
    from public.profiles p
    left join public.rankings r on r.user_id = p.id
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

revoke execute on function public.profile_rank(uuid) from public;
grant execute on function public.profile_rank(uuid) to anon, authenticated;

-- ============================================================
-- Storage: "avatars" bucket. profiles.avatar_url holds the file's path in
-- this bucket, e.g. "<user id>/1731364800000.png". Users can only write
-- inside the folder named after their own user id.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "users upload their own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users replace their own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete their own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

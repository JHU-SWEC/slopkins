-- Want to Try is public: anyone (signed in or not) can see what someone saved,
-- like the rest of a profile. Saving and removing stay owner-only.
--
-- dish_alerts:  dishes bookmarked on menus
-- saved_plates: plates saved from other people's posts. This also makes who
--               saved a post visible (on the saver's profile); the counts on
--               posts still come from meal_save_counts.

drop policy "users read their own alerts" on public.dish_alerts;
create policy "dish alerts are readable by everyone" on public.dish_alerts
  for select to anon, authenticated
  using (true);

drop policy "users read their own saved plates" on public.saved_plates;
create policy "saved plates are readable by everyone" on public.saved_plates
  for select to anon, authenticated
  using (true);

grant select on public.dish_alerts, public.saved_plates to anon;

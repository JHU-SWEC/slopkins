# Slopkins To-Do

Next features, in order.

1. [x] **Dishes and rankings in Supabase, tied to profiles**
   - Done in 875b142: meals, rankings, and comparisons are saved in Supabase (`features/ranking/queries.ts`, `features/ranking/actions.ts`).
2. [x] **My list placed directly on the profile page**
   - Done in 0a50a85: it shows under Ranked dishes on the profile.
3. [x] **Feed and Activity pages populated with real rankings, plus photo uploads (in Supabase)**
   - Feed reads real meals and scores (#23); meal photos are added while logging and can be removed or the post deleted (soft delete).
4. [x] **Macros feature made into an optional add-on, off by default**
   - Toggle added in #19, switched to off by default after that (`app/(app)/dining/use-macros.ts`).
5. [ ] **Tappable plates: a post page**
   - Add a post page (`/p/[id]`) that shows one meal as the same card the feed uses (photo, notes, score, likes, comments).
   - Link each row on the profile's Rankings tab (`features/ranking/components/rankings-list.tsx`) to it, so tapping a ranked plate opens it.
   - Also useful for notifications ("Kyle liked your plate") and shared links. No database change needed.
6. [ ] **Want to Try: "On the menu today"**
   - On the profile's Want to Try tab (`features/ranking/components/WantToTry.tsx`), tag each saved dish that's being served today, e.g. "On the menu today · FFC lunch", linking to that hall's menu.
   - Check saved dishes against today's menus from the weekly cache (`getMenus` in `lib/menus.ts`), matching on the Nutrislice food id. No database change needed.

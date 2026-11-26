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

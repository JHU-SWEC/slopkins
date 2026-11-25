# Slopkins To-Do

Next features, in order.

1. [ ] **Dishes and rankings in Supabase, tied to profiles**
   - Meals, rankings, and comparisons live in each browser's localStorage today (`features/ranking/store.ts`). The tables already exist in Supabase.
2. [x] **My list placed directly on the profile page**
   - Done in 0a50a85: it shows under Ranked dishes on the profile.
3. [ ] **Feed and Activity pages populated with real rankings, plus photo uploads (in Supabase)**
   - The feed shows mock posts (`lib/mock-data`), and Activity's friends' meals and ratings are empty until step 1 lands.
4. [ ] **Macros feature made into an optional add-on, off by default**
   - Partly done in #19: the dining pages have a macros toggle, but it's on by default (`app/(app)/dining/use-macros.ts`).

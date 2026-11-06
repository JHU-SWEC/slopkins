# UI Refactor: Skeleton Screens

Replaces the current home page with skeleton screens for sign-in, feed, dining and profile. Every screen is a mockup: hardcoded or mock data, no auth, no database writes. Feature owners replace each skeleton with the real thing.

Framework: Next.js 16 App Router. Schema: [database-schema.md](database-schema.md).

## Scope

In:

- Routes, layout and navigation for every screen.
- Skeleton UI with mock data, so the whole flow can be clicked through.
- Skip buttons, so every screen is reachable without signing in.

Out:

- Real sign-in (Lucas, Amy).
- Real feed data and following (Lucas, Amy).
- Real menus from the Nutrislice ingest (Kyle).
- Ranking (Jonny).
- Profile design (Lucas).

## Routes

| route            | content                                               |
| ---------------- | ----------------------------------------------------- |
| `/`              | sign-in skeleton with a "Skip" button to `/feed`      |
| `/feed`          | mock meal posts from followed users                   |
| `/dining`        | the three halls                                       |
| `/dining/[slug]` | mock menu for one hall, multi-select to "log" a meal  |
| `/profile`       | "In progress" placeholder                             |

File layout:

```
app/
  page.tsx                  sign-in skeleton
  (app)/
    layout.tsx              bottom nav: Feed, Dining, Profile
    feed/page.tsx
    dining/page.tsx
    dining/[slug]/page.tsx
    profile/page.tsx
lib/
  halls.ts                  the three halls, hardcoded
  mock-data.ts              mock feed posts and menus
```

- `(app)` is a route group. It shares the nav layout without adding a URL segment.
- No route protection. `proxy.ts` keeps refreshing the session but doesn't redirect.
- Delete `app/test-supabase/` and the `/rank` link.

## Skip buttons

- `/`: a "Skip" link under the sign-in form goes to `/feed`.
- The bottom nav is always visible in `(app)`, so every screen is one tap away.
- Remove the skip link when real sign-in ships.

## Pages

### `/` Sign-in

Skeleton only. Lucas designs and implements it.

- App name, one-line pitch, a placeholder "Sign in with JHU" button that does nothing.
- "Skip" link to `/feed`.

### `/feed`

Skeleton list of mock posts from `lib/mock-data.ts`.

- Each post: avatar placeholder, username, hall name, meal, relative time, dish names as chips.
- Empty-state placeholder: "Follow friends to see what they ate."

### `/dining`

The hall list is final. Read it from `lib/halls.ts`, moved from the current `app/page.tsx`:

| slug       | name     | description       |
| ---------- | -------- | ----------------- |
| `ffc`      | FFC      | Fresh Food Cafe   |
| `nolans`   | Nolan's  | Nolan's on 33rd   |
| `levering` | Levering | Levering Kitchens |

Each card links to `/dining/[slug]`. An unknown slug returns `notFound()`.

### `/dining/[slug]`

Skeleton menu from `lib/mock-data.ts`.

- **Tabs:** Breakfast, Lunch, Dinner. For Levering, the tabs are kitchens: Taco, Mosaic Global Kitchen, Red Lantern Kitchen, Tossed Kitchen.
- **Inside a tab:** mock dishes grouped by station, each with a checkbox.
- **Selection:** client state. A sticky bottom bar shows "Log meal (n)" and is disabled at 0.
- **Submit:** goes to `/feed`. Nothing is saved.

### `/profile`

Placeholder that says "In progress". Lucas designs and builds the page.

## Mock data

- `lib/mock-data.ts` exports `mockFeedPosts` and `mockMenus` (keyed by hall slug, then tab).
- Shape it like the real tables (`dishes.name`, `menu_items.station`, `meal_type`), so swapping in Supabase queries changes the data source but not the components.
- Each owner deletes their part when the real data lands.

## Later

Notes for owners, not part of this refactor:

- **Sign-in (Lucas, Amy):** add redirects in `proxy.ts` as an optimistic check, plus a server-side `requireUser()` check in each page. See `node_modules/next/dist/docs/01-app/02-guides/authentication.md`.
- **Logged meals:** a post is likely a logged meal (user, hall, meal, date, several dishes). That needs new tables, for example `meals` and `meal_dishes`, in their own migration.
- **Ranking hook (Jonny):** after logging, redirect to the rank flow with the meal's dishes.
- **Real menus (Kyle):** cache public dining data with `'use cache'`. Compute "today" in America/New_York and pass it in as an argument.
- **Real hall list:** read it from `dining_halls` once that table is seeded.

## Open questions

- Do your own posts appear in your feed?
- What are the meal cutoff times for picking the default tab?

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Slopkins is a Beli-style app for JHU meal-plan students: rank dining hall plates by pairwise "which plate was better?", browse today's menus (FFC, Nolan's, Levering) from the public Nutrislice API, and follow friends' meals. See [README.md](README.md) and [docs/](docs/).

## Commands

```bash
npm run dev            # http://localhost:3000 (needs .env.local, see README)
npx tsc --noEmit       # typecheck
npm run lint           # eslint (next core-web-vitals + typescript)
npm run build
```

There is no test suite. Run typecheck, lint and build before opening a PR.

Database:

```bash
npx supabase@2 migration new <name>     # new file in supabase/migrations/
supabase db reset                       # apply migrations locally
supabase gen types typescript --local > lib/supabase/database.types.ts
```

## Rules

- **Next.js 16 with `cacheComponents` and `partialPrefetching` on.** APIs differ from older versions; read `node_modules/next/dist/docs/` before writing Next code. Conventions used here:
  - Middleware is `proxy.ts` (exported `proxy` function), not `middleware.ts`.
  - Pages that read the user/cookies call `await connection()` first and wrap dynamic parts in `<Suspense>`.
  - Server Actions call `refresh()` from `next/cache` after writes.
  - Only `lib/menus.ts` uses `"use cache"` + `cacheLife("hours")` (Nutrislice weeks).
- **Migrations:** never edit one that has already been applied; write a new one. Commit the regenerated `lib/supabase/database.types.ts` in the same PR. Don't change schema in the Supabase dashboard, and don't push migrations to the shared project except from `main` after merge. Every table has RLS with policies.
- Branch off `main` and open a PR; don't push to `main`.
- `features/ranking/score.ts` (`SCORE_RANGES`, `sentimentScore`) is mirrored by the SQL function `public.sentiment_score`. Change both together.
- Server-only secrets must never use the `NEXT_PUBLIC_` prefix.

## Architecture

**Layout.** `app/` holds routes only; logic lives in `features/<area>/` (`ranking`, `feed`, `auth-social`, `tour`, `dining`) with a consistent split: `queries.ts` (server reads), `actions.ts` (`"use server"` writes, return `{ error? }`), plus components. Shared code is in `lib/`. `app/(app)/` is the shell with bottom nav/sidebar; it does **no** auth check — each page decides what signed-out visitors see.

**Supabase clients** (`lib/supabase/`):
- `server.ts` — `createClient()` for Server Components/Actions/Route Handlers. Use `getSignedInUser(supabase)` to get the user: it verifies the JWT locally via `getClaims()` (no network call). Use `auth.getUser()` only when live account data is needed.
- `client.ts` — browser client.
- `admin.ts` — secret-key client that bypasses RLS (`server-only`). Only for writes users can't make themselves, e.g. inserting `dishes`/`menu_items` from Nutrislice.
- `proxy.ts` — `updateSession` refreshes the session on every request and redirects signed-in users with a placeholder username to `/welcome` (cached via a cookie keyed by user id).

**Data writes go through Postgres RPCs** where they span tables or need permission logic (`log_meal`, `rank_plate`, `get_feed`, `get_posts`, `profile_rank`, `soft_delete_meal`, `set_meal_caption`, …), defined in `supabase/migrations/`. Meals and comments are soft-deleted.

**Menus.** `lib/halls.ts` maps each hall to its Nutrislice school and menu-type slugs. `lib/menus.ts` fetches and caches a whole week per menu server-side (Nutrislice has no CORS). Ingredients are left out of the menu payload and fetched on demand by `app/(app)/dining/[slug]/details/route.ts`.

**Log → rank flow** (details in [features/ranking/README.md](features/ranking/README.md)):
1. On `/dining/[slug]` the browser sends only Nutrislice food ids. `logMealAction` re-fetches the menu on the server, upserts dishes with the admin client, then calls `log_meal` as the user.
2. `/rank?meal=<id>`: pick a verdict (liked/fine/disliked), then binary-insert against past plates in that group (`insertion.ts`), saved via `rank_plate`.
3. Scores are banded by verdict (liked 7–10, fine 4–7, disliked 0–4) and re-spread across the band whenever a group changes, so `plate_rankings.score` always matches list order. `dish_scores` averages plate scores across all users.
4. A plate is unranked while any `meal_dishes.rank_status` is `pending`; `/dining` shows a "Plate to rank" banner to resume.

Ranking is per plate since 2026-11-26. The old per-dish tables (`rankings`, `comparisons`, `rank_dish`) and `dishes.rankable` still exist but the app no longer uses them.

**Styling.** Tailwind 4 via the Turbopack loader. Dark mode follows `data-theme` on `<html>` (toggle), not the OS. `app/globals.css` remaps many light utility classes (`bg-white`, gray scale, tints) under `[data-theme="dark"]`, so existing components get dark mode automatically; new components may use `dark:`.

**Deployment.** Vercel, region `pdx1` (next to Supabase in `us-west-2`) because every page makes several DB calls. Images are allowed only from the Supabase `avatars` and `meal-photos` public buckets (`next.config.ts`).

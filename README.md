# Slopkins

A Beli-style app for Johns Hopkins students on the meal plan. Students rank dining hall dishes by answering "is X or Y better?", see what's on today's menu with the best dishes first, and follow friends to see what they ate.

Built by JHU-SWEC (HopBuilds). Deadline: **Dec 11, 2026**. Full plan: [docs/project-plan.md](docs/project-plan.md).

## Why

- It's all slop: hard to pick out healthy food and eat clean.
- Dining halls get busy and lines get long.
- Freshmen learn what's good through trial and error.

## Scope

- **Dining halls:** FFC (Fresh Food Cafe), Nolan's on 33rd, Levering Kitchens
- **Users:** students on the JHU meal plan
- **Data:** the public [Nutrislice](https://hopkinsdining.api.nutrislice.com/menu/api/schools/) menu API

## Features and owners

| feature                 | owner                     | status                                                        |
| ----------------------- | ------------------------- | ------------------------------------------------------------- |
| Auth + Profile + Social | Lucas Kohlmeyer, Amy Yang | skeleton: sign-in placeholder, mock feed, profile placeholder |
| Dining hall pages       | Kyle Li                   | skeleton: real hall list, mock menus, meal multi-select       |
| Add + Rank flow         | Jonny                     | `/rank` and `/my-list`, saved in localStorage with mock data  |

Nothing reads from Supabase yet. The schema is live, and each owner swaps their mock data for real queries.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19, TypeScript and Tailwind 4
- `cacheComponents` and `partialPrefetching` are on. APIs differ from older Next versions, so read `node_modules/next/dist/docs/` before writing Next code (see [AGENTS.md](AGENTS.md)).
- [Supabase](https://supabase.com): Postgres, Auth and Storage, via `@supabase/ssr`

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the repo root. Get the values from a teammate; never commit this file.

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```

   Server-only secrets, like the Supabase secret key for the menu ingest, must never use the `NEXT_PUBLIC_` prefix. That prefix ships the value to the browser.

3. Run the dev server and open http://localhost:3000:

   ```bash
   npm run dev
   ```

The sign-in page has a **Skip** link, so every screen is reachable without an account.

## Project layout

```
app/
  page.tsx              sign-in (placeholder)
  (app)/                screens with the bottom nav: feed, dining, profile
  rank/  my-list/       Add + Rank flow
features/
  ranking/              ranking logic, components, localStorage store
  dining/  auth-social/ feature notes
lib/
  supabase/             browser, server and proxy clients, generated DB types
  halls.ts              the three dining halls
  mock-data.ts          mock feed posts and menus
supabase/migrations/    database migrations
docs/                   project plan, schema, UI design
proxy.ts                refreshes the Supabase session on each request
```

## Docs

- [Project plan](docs/project-plan.md): team, goals, stretch goals, marketing
- [System design](docs/system-design.md): components, data flows, trust boundaries
- [Database schema](docs/database-schema.md) and [diagram](docs/schema-diagram.md)
- [UI refactor](docs/ui-refactor.md): the current skeleton screens

## Workflow

- Branch off `main` and open a PR. Don't push straight to `main`.
- **Database changes:**
  - Create each change with `npx supabase@2 migration new <name>` on your branch, and include the regenerated `lib/supabase/database.types.ts` in the same PR.
  - Migrations are pushed to the shared Supabase project only from `main`, after merge.
  - Never edit a migration that has already been applied. Write a new one.
  - Don't change the schema in the Supabase dashboard.
- Before opening a PR, run `npx tsc --noEmit`, `npm run lint` and `npm run build`.

## Team

- **Devs:** Miles, Shawn, Kyle, Jonny, Lucas
- **Marketing:** Leo, Sophie
- **Meetings:** Slopkins meeting Tuesdays 7pm, GBM Thursdays 8pm

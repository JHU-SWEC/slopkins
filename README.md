# Slopkins

A Beli-style app for Johns Hopkins students on the meal plan. Students rank their dining hall plates by answering "which plate was better?", see what's on today's menu with the best dishes first, and follow friends to see what they ate.

Built by JHU-SWEC (HopBuilds). Deadline: **Dec 11, 2026**. Full plan: [docs/project-plan.md](docs/project-plan.md).

## Why

- It's all slop: hard to pick out healthy food and eat clean.
- Dining halls get busy and lines get long.
- Freshmen learn what's good through trial and error.

## Scope

- **Dining halls:** FFC (Fresh Food Cafe), Nolan's on 33rd, Levering Kitchens
- **Users:** students on the JHU meal plan
- **Data:** the public [Nutrislice](https://hopkinsdining.api.nutrislice.com/menu/api/schools/) menu API

## Stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19, TypeScript and Tailwind 4
- `cacheComponents` and `partialPrefetching` are on. APIs differ from older Next versions, so read `node_modules/next/dist/docs/` before writing Next code (see [AGENTS.md](AGENTS.md)).
- [Supabase](https://supabase.com): Postgres, Auth and Storage, via `@supabase/ssr`
- Hosted on Vercel. Server code runs in `pdx1` (Portland, set in `vercel.json`) to sit next to the Supabase project in `us-west-2`; every page makes several database calls, so a cross-country region adds up fast.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the repo root. Get the values from a teammate; never commit this file.

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SECRET_KEY=...
   ```

   `SUPABASE_SECRET_KEY` lets the server record dishes from Nutrislice when someone logs a meal (`lib/supabase/admin.ts`). Without it, logging a meal shows an error. Server-only secrets like this must never use the `NEXT_PUBLIC_` prefix. That prefix ships the value to the browser.

3. Run the dev server and open http://localhost:3000:

   ```bash
   npm run dev
   ```

Sign in with Google to use the app. Pages like the feed show a log-in prompt when you're signed out.

## Project layout

```
app/
  page.tsx              Google sign-in (/login shows the same screen)
  welcome/              pick a username after first sign-in
  auth/                 OAuth callback and error page
  (app)/                screens with the bottom nav; each page handles signed-out visitors
    feed/ dining/ rank/ profile/ activity/ search/ u/[username]/
    my-list/            redirects to your profile's Ranked Plates tab
features/
  ranking/              log + rank flow: binary insertion, band scores, queries, actions
  feed/                 feed posts, likes, comments, saves, edit/delete
  auth-social/          sign-in, profiles, follows, search, notifications
  tour/                 first-visit guided tour
  dining/               feature notes
lib/
  supabase/             browser, server, admin (secret key) and proxy clients, generated DB types
  halls.ts              the three dining halls and their Nutrislice menus
  menus.ts              fetches and caches Nutrislice menus (server-only)
  nutrition.ts          nutrition per serving or per 100 g
  dates.ts              menu dates in Baltimore time
supabase/migrations/    database migrations
docs/                   project plan, schema, UI/UX roadmap, to-do
proxy.ts                refreshes the Supabase session; sends new users to /welcome
```

## Docs

- [Project plan](docs/project-plan.md): team, goals, stretch goals, marketing
- [Database schema](docs/database-schema.md) and [diagram](docs/schema-diagram.md)
- [To-do](docs/todo.md): next features, in order
- [UI/UX roadmap](docs/ux-roadmap.md): planned UI and UX improvements, by phase

## Workflow

- Branch off `main` and open a PR. Don't push straight to `main`.
- **Database changes:**
  - Create each change with `npx supabase@2 migration new <name>` on your branch, and include the regenerated `lib/supabase/database.types.ts` in the same PR.
  - Migrations are pushed to the shared Supabase project only from `main`, after merge.
  - Never edit a migration that has already been applied. Write a new one.
  - Don't change the schema in the Supabase dashboard.
- Before opening a PR, run `npx tsc --noEmit`, `npm run lint` and `npm run build`.

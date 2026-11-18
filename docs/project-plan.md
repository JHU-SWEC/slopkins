# Slopkins Project Plan

A Beli-inspired app made specifically for Hopkins students.

## Team

- **Devs:** Miles, Shawn, Kyle, Jonny, Lucas
- **Marketing:** Leo, Sophie
- **GitHub:** https://github.com/JHU-SWEC/slopkins
- **GitHub usernames:** `Kai-Ao`, `swang401`, `mileszh`, `lyfyang`, `jxue16`
- **Meetings:** Slopkins meeting Tuesdays 7pm, GBM Thursdays 8pm
- **Emails:**
  - kyle.li528@gmail.com
  - mileszh05@gmail.com
  - jonathan.y.xue@gmail.com
  - shawn.wang268@gmail.com

## Problem

- It's all slop: hard to pick out healthy stuff and eat clean.
- Dining halls have busy hours, and lines can get super long.
- Freshmen have to learn what's good and bad through trial and error.

## Scope

- **Dining halls:** Levering, Nolan's, FFC
- **Target users:** people on the JHU meal plan

## Core features

### Auth + Profile + Social (Lucas Kohlmeyer, Amy Yang)

- Google sign-in (Google OAuth through Supabase Auth)
- Follow friends and see a feed of their recent postings
- Profile page showing each user's ranked list
- School ranking?
- Profile picture
- Have some fun here

### Dining hall landing page (Kyle Li)

- Ingest the Nutrislice API and display the menu for each dining hall
- Format menus and macros
- Notifier for certain items
- Today's items by mealtime, top-ranked first
- Stretch: map view and search
- Stretch: load ~100 restaurants near Homewood plus small businesses (Sidechat Sourdough, Claude's Cookies; needs their permission)

### Add + Rank flow (Jonny)

- Dish comparison and score calculation: "Is dish X or Y better?"
- Optional comments and reviews
- "My list" page showing my ranked restaurants
- Stretch: add location

## Stretch goals

- Work with Sidechat Sourdough and Claude's Cookies to help them promote and manage orders through the app.
- Show when it's busiest, alert when an item runs out, and alert when new food is out.
- Local businesses:
  - Sourdough
  - Claude's Cookies
  - The people who sell chai around the Homewood corner

## Milestones

- Finish by **Dec 11, 2026** (last week of classes).

## Marketing: scaling to the whole school

- Make the best dish comparison
- Instagram and Sidechat marketing
- Get on the TVs in the dining halls
- Incentivize users somehow
- Dining hall Instagram interviews
- Blue Jay statue
- "When you pie / egg someone, you have to bark"
- Gamify the app (rewards, leaderboard)
- Slopkins merch 💯

## Data sources

- **Nutrislice** (public API). Example, FFC lunch week menu:
  `https://hopkinsdining.api.nutrislice.com/menu/api/weeks/school/hopkins-cafe/menu-type/hopkins-cafe-lunch/{yyyy}/{mm}/{dd}/`
- Full endpoint notes and the hall-to-menu mapping: [database-schema.md](database-schema.md) (`nutrislice_menus`).

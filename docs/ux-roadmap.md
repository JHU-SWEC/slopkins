# Slopkins UI/UX Roadmap

Last updated Nov 27, 2026.

## Summary

Ship 10 core-loop fixes before the Dec 11 deadline, then grow discovery and daily habits after launch. Slopkins already has Beli's core (verdict plus pairwise ranking, banded scores) and an Instagram-style shell (feed, profile tabs, sidebar nav). Four gaps remain:

- The app doesn't answer "what should I eat right now?" at a glance.
- Ranking feels like a form, not a game.
- The feed has little to discover beyond who you follow.
- Nothing brings people back daily.

Each item below lists the app it borrows from, where it lives in the code, and rough effort: S (under a day), M (1–3 days), L (a week or more).

## Principles we're borrowing

| App | Principle | What it means for Slopkins |
| --- | --- | --- |
| Beli | Every action ends in a satisfying number; friends' taste is the signal | Rank results feel like a reveal; friend scores beat global ones |
| Instagram | Media first, one-tap actions, recency up top | Big photos, double-tap to like, a "who ate recently" row |
| Strava / Duolingo | Streaks, stats and milestones bring people back | Logging streaks, profile stats, weekly recap |
| Letterboxd | Your diary and your list are your identity | Ranked list and logged meals are the profile's centerpiece |

## Phase 1: Core loop (before Dec 11)

These make choosing, logging and ranking feel fast and rewarding. No database migrations except #10's paging parameter.

| # | Improvement | Inspired by | Where | Effort |
| --- | --- | --- | --- | --- |
| 1 | Hall cards show the meal being served now, top-rated mains with scores, and "N friends ate here today" | Beli trending, Google Maps "popular now" | `app/(app)/dining/page.tsx`; reuse `getMenus`, `getDishScoresByFoodId` and the current-meal logic in `dining/[slug]/page.tsx` | M |
| 2 | Verdict step shows each band in color (Liked 7–10, Fine 4–7, Didn't like 0–4) | Beli | `features/ranking/components/RankPlate.tsx`, read from `SCORE_RANGES` | S |
| 3 | "Which plate was better?" as two big photo cards with "or" between them, plus a progress bar | Beli | `RankPlate.tsx`; add `photo_path` to `RankedPlate` and `MealWithDishes` | M |
| 4 | Result reveal: big score circle, "#3 of 12" animation, share button | Beli, Spotify Wrapped | `features/ranking/components/RankMeal.tsx` | S |
| 5 | Tap the whole menu row to select; ⓘ icon for nutrition; lighter bookmark | Uber Eats, DoorDash | `app/(app)/dining/[slug]/menu-picker.tsx` | M |
| 6 | Confirm before switching meal tabs clears your picks | — | `menu-picker.tsx` (`switchTab`) | S |
| 7 | Toasts after like, save, follow, log and delete | Instagram | New shared toast component | S |
| 8 | Full-width 4:3 feed photos, tap to enlarge, double-tap to like | Instagram | `features/feed/post.tsx`, `like-button.tsx` | M |
| 9 | Your unranked post shows a clear "Rank this plate" banner instead of a small dashed circle | Beli to-rank list | `post.tsx` | S |
| 10 | Feed loads more than 30 posts ("Load more" or infinite scroll) | Instagram | `features/feed/queries.ts` (`MAX_POSTS`), cursor param on `get_feed` | M |

## Phase 2: Discovery and social

These turn the feed and search into ways to find good food, not just friends.

| # | Improvement | Inspired by | Where | Effort |
| --- | --- | --- | --- | --- |
| 11 | Search dishes and halls, not just people (tabs: Top, People, Dishes) | Instagram, Beli search | `app/(app)/search/page.tsx` | M |
| 12 | Dish page: community score, friends who ranked it, when and where it's served next, Want to Try | Beli restaurant page, Letterboxd film page | New `/dish/[id]` route | L |
| 13 | Dish chips on posts link to the dish page | Instagram tags | `features/feed/post.tsx` | S |
| 14 | Friends' score beside the community score ("Your friends: 8.4") | Beli | Menu rows, dish page | M |
| 15 | Taste match on profiles ("82% taste match") | Beli, Letterboxd | `features/auth-social/profile/profile-view.tsx`, new SQL function | M |
| 16 | Suggested people: mutual follows, same hall, similar taste | Instagram "Suggested for you" | Search empty state, `getNewestProfiles` | M |
| 17 | Row at the top of the feed showing friends who ate in the last few hours | Instagram Stories, BeReal | `app/(app)/feed/page.tsx` | M |
| 18 | Replies and @mentions in comments | Instagram | `features/feed/post-comments.tsx` | M |
| 19 | Grouped notifications ("Kyle and 3 others liked your plate") | Instagram | `features/auth-social/activity/*` | S |
| 20 | Feed filter chips: Friends, Everyone, This hall | Beli Friends / Trending | `feed/page.tsx`, `get_feed` | M |

## Phase 3: Habit and identity

These give people a reason to open Slopkins every meal and to show off their profile.

| # | Improvement | Inspired by | Where | Effort |
| --- | --- | --- | --- | --- |
| 21 | Profile stats: plates ranked, favorite hall, top dish, streak | Strava, Letterboxd | `profile-view.tsx` | M |
| 22 | Logging streaks and milestones (10 plates, every hall tried) | Duolingo, Beli | Profile, toasts | M |
| 23 | Ranked list filters (hall, meal) and a photo-grid view | Beli lists, Instagram grid | `features/ranking/components/MyList.tsx`, `profile-tabs.tsx` | M |
| 24 | Want to Try alerts: "Butter chicken is at FFC today" | Beli bookmarks, Resy Notify | Notifications + daily menu check | L |
| 25 | Weekly recap card ("9 plates this week, best: …") as a shareable image | Spotify Wrapped, Strava | New route + generated image | L |
| 26 | Hall leaderboard and "best dish this week" | Beli leaderboards | `/dining` | M |
| 27 | Future days highlight your Want to Try dishes | Resy, OpenTable | `day-switcher.tsx`, `menu-picker.tsx` | S |

## Onboarding

New users should see a full feed and a started list within their first two minutes.

| # | Improvement | Inspired by | Where | Effort |
| --- | --- | --- | --- | --- |
| 28 | Welcome flow asks for your home dining hall and suggests 3 people to follow | Instagram, Beli onboarding | `app/welcome/page.tsx` | M |
| 29 | "Rank 3 plates you remember" so your list isn't empty on day one | Beli onboarding ranking | Welcome flow, rank components | M |
| 30 | Empty states with one clear action on feed, lists and notifications | Instagram | Feed, `MyList.tsx`, activity | S |
| 31 | Shorter tour, shown in context (first menu visit, first rank) | Duolingo | `features/tour/*` | S |

## Polish and accessibility

Small fixes that can ride along with any PR above.

| # | Improvement | Where | Effort |
| --- | --- | --- | --- |
| 32 | Loading skeletons that match the final layout on every page (the feed already does this) | All `Suspense` fallbacks | S |
| 33 | Visible focus rings on every tappable row; tap targets at least 44px | Menu rows, lists, nav | S |
| 34 | Show score plate counts on phones (they're only in hover tooltips now) | `menu-picker.tsx` `ScoreBubble` | S |
| 35 | Subtle motion on like, save and rank result; respect reduced-motion settings | Feed, rank | S |
| 36 | Installable app on the home screen (web app manifest and icons) | `app/` | M |
| 37 | Dark mode check on new components; use `dark:` classes instead of global overrides | `app/globals.css` | S |

## Marketing hooks

Four features double as screenshot-ready posts for Instagram and TikTok:

- The rank result card with its share button (#4)
- The weekly recap card (#25)
- Hall leaderboards and "best dish this week" (#26)
- Profile share links, which already exist

## Suggested owners and order

Phase 1 ships by Dec 11, split along existing feature ownership. Phases 2 and 3 follow launch, ordered by what people actually use.

| Area | Owner | Phase 1 items |
| --- | --- | --- |
| Dining | Kyle | 1, 5, 6 |
| Ranking | Jonny | 2, 3, 4, 9 |
| Feed, social, profile | Lucas and team | 7, 8, 10 |

## Open questions

- [ ] Should the feed show everyone on campus, or only people you follow?
- [ ] Do we need private profiles before adding taste match or a campus-wide feed?
- [ ] Is an installable home-screen app (#36) in scope, or web only?

# Log + Rank Flow
Owner: Jonny

Log a meal, then rank the dishes worth ranking. Schema: [docs/database-schema.md](../../docs/database-schema.md#add--rank-owner-jonny).

## Pipeline

1. **Log** (`/dining/[slug]`). Check off what you ate, then **Review meal**. Only mains are rankable: `rankable` comes from Kyle's `isMain` in `lib/menus.ts`, so sides, toppings, cereal, sauces and drinks are logged but never ranked.
   - **Log & rank** saves the meal and opens `/rank?meal=<id>`.
   - **Log only** saves the meal with every dish skipped and goes to the feed.
   - If no main is selected, there's just **Log meal**.
2. **Rank** (`/rank?meal=<id>`). One rankable dish at a time:
   - Already on your list? **Keep it there** (one tap) or **Re-rank**.
   - Verdict: liked / fine / didn't like.
   - "Which was better?" against your list, binary search within that verdict's group (at most ⌈log₂(n+1)⌉ questions).
   - Optional comment, then save.
   - **Skip** is on every step, plus **Skip the rest**.
3. **Summary**. Every dish in the meal with its rank, "Rank it" for skipped dishes, or "not rankable".

Leave halfway and the remaining dishes stay `pending`; `/dining` shows a "N dishes to rank" banner that resumes the queue.

## Scoring

Beli-style: the verdict picks a band (liked 7–10, fine 4–7, disliked 0–4), and the dish's position in that group spreads it evenly across the band. A disliked dish never outscores a liked one. Scores are re-spread whenever a group changes, so `rankings.score` is always the list order and `dish_scores` can average it. `score.ts` and the SQL `sentiment_score` must stay in sync.

## Code

| file | what |
| ---- | ---- |
| `queries.ts` | Server reads: a user's ranked list, one meal, meals with dishes left to rank. |
| `actions.ts` | Server actions: `logMealAction`, `rankDishAction` (`rank_dish`), `setRankStatusAction` / `skipRestAction` (`meal_dishes` updates). |
| `format.ts` | `mealTitle`, e.g. "FFC · Lunch". |
| `insertion.ts` | Binary search over a sentiment group. |
| `score.ts` | Band scores. |
| `components/RankMeal.tsx` | Queue + summary for one meal. |
| `components/RankDish.tsx` | Keep / verdict / compare / comment for one dish. |
| `components/PendingMeals.tsx` | "Dishes to rank" banner. |
| `components/MyList.tsx` | A ranked list, shown under "Ranked dishes" on every profile (`/my-list` redirects to yours). |

Everything is in Supabase; you need to be signed in to log or rank. The browser sends only Nutrislice food ids. `logMealAction` re-fetches today's menu on the server, adds any new `dishes` (`rankable` from `isMain`, only on insert so admin fixes stick) and `menu_items` with the secret-key client (`lib/supabase/admin.ts`), then calls `log_meal` as the user. Dish ids everywhere else are `dishes.id`. Hall and station labels come from the `dish_places` view (latest `menu_items` row).

## Ranking methods considered

| method | how | verdict |
| ------ | --- | ------- |
| **Per dish, verdict + pairwise insertion** (chosen) | Bucket, then 1–3 "X or Y?" questions | Stable personal list, few taps, comparisons double as data. Matches how people think about specific dishes. |
| Per dish, star/number rating | Tap 1–10 | Fastest, but scores drift and cluster (everything's a 7), and lists don't feel earned. Could be a "quick rate" fallback. |
| Per plate | Rate the whole meal | One tap, but the score can't be attributed: a great curry and bad rice average out. Doesn't help "what should I get?". Better as a feed reaction than a ranking. |
| Per plate, then attribute | Rate the plate, then "what carried it?" | Interesting, but two steps for less signal than per-dish. |
| Elo / Bradley–Terry from comparisons | Global scores from all users' comparisons | Good for a *global* leaderboard later; `comparisons` already logs the raw data. Not for personal lists, where insertion is exact and cheaper. |
| Ranking menu instances | Rank "FFC tikka on Nov 18" | Captures day-to-day quality swings, but lists fill with duplicates. Could show as "last time it was…" on the dish instead. |

Possible follow-ups: global Elo from `comparisons` for the landing page sort; "quick rate" (verdict only, placed at the middle of its band) for people who don't want comparisons; re-asking a comparison when two adjacent dishes were placed far apart in time.

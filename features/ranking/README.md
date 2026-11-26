# Log + Rank Flow
Owner: Jonny

Log a meal, then rank the plate as a whole. Schema: [docs/database-schema.md](../../docs/database-schema.md#add--rank-owner-jonny).

## Pipeline

1. **Log** (`/dining/[slug]`). Check off what you ate, then **Review meal**. Any plate can be ranked, sides and all.
   - **Log & rank** saves the meal and opens `/rank?meal=<id>`. There's no "log only": every plate gets ranked.
2. **Rank** (`/rank?meal=<id>`). The whole plate:
   - Verdict: liked / fine / didn't like.
   - "Which plate was better?" against your past plates, binary search within that verdict's group (at most ⌈log₂(n+1)⌉ questions).
   - Save (`rank_plate`). Comments are written when logging the meal, not here.
   - No skip. Leave before saving and the plate waits in the queue.
3. **Summary**. The plate's rank and score with **Re-rank** (or **Rank it** for older plates that were skipped).

The queue still lives in `meal_dishes.rank_status`: a plate is waiting while any of its dishes is `pending`, and `rank_plate` marks them all `ranked`. Leave before saving and `/dining` shows a "Plate to rank" banner that resumes it.

## Scoring

Beli-style: the verdict picks a band (liked 7–10, fine 4–7, disliked 0–4), and the plate's position in that group spreads it evenly across the band. A disliked plate never outscores a liked one. Scores are re-spread whenever a group changes, so `plate_rankings.score` is always the list order.

A dish's score isn't something anyone rates: `dish_scores` is the average score of every ranked plate the dish was on, across all users (every dish counts, sides too).

Plates replaced per-dish ranking on 2026-11-26. The old `rankings`, `comparisons` and `rank_dish` are still in the database with their data, but the app no longer writes to them. `dishes.rankable` is still set on log but no longer used. `score.ts` and the SQL `sentiment_score` must stay in sync.

## Code

| file | what |
| ---- | ---- |
| `queries.ts` | Server reads: a user's ranked plates, one meal, meals waiting to be ranked. |
| `actions.ts` | Server actions: `logMealAction`, `rankPlateAction` (`rank_plate`), `rerankPlateAction` / `skipPlateAction` (`meal_dishes` updates). |
| `format.ts` | `mealTitle`, e.g. "FFC · Lunch", and `mealDate`. |
| `insertion.ts` | Binary search over a sentiment group. |
| `score.ts` | Band scores. |
| `components/RankMeal.tsx` | Rank step + summary for one meal. |
| `components/RankPlate.tsx` | Verdict / compare / comment for one plate. |
| `components/PendingMeals.tsx` | "Plate to rank" banner. |
| `components/MyList.tsx` | Ranked plates, best first, shown under "Ranked Plates" on every profile (`/my-list` redirects to yours). |

Everything is in Supabase; you need to be signed in to log or rank. The browser sends only Nutrislice food ids. `logMealAction` re-fetches today's menu on the server, adds any new `dishes` (`rankable` from `isMain`, only on insert so admin fixes stick) and `menu_items` with the secret-key client (`lib/supabase/admin.ts`), then calls `log_meal` as the user. Dish ids everywhere else are `dishes.id`. Hall and station labels come from the `dish_places` view (latest `menu_items` row).

## Ranking methods considered

| method | how | verdict |
| ------ | --- | ------- |
| **Per dish, verdict + pairwise insertion** (used until 2026-11-26) | Bucket, then 1–3 "X or Y?" questions | Stable personal list, few taps, comparisons double as data. Matches how people think about specific dishes. |
| Per dish, star/number rating | Tap 1–10 | Fastest, but scores drift and cluster (everything's a 7), and lists don't feel earned. Could be a "quick rate" fallback. |
| **Per plate, verdict + pairwise insertion** (chosen) | Same flow as per dish, for the whole meal | One ranking per meal, so it's quicker and matches how people post. The score can't be attributed to one dish (a great curry and bad rice average out), so it helps less with "what should I get?". |
| Per plate, then attribute | Rate the plate, then "what carried it?" | Interesting, but two steps for less signal than per-dish. |
| Elo / Bradley–Terry from comparisons | Global scores from all users' comparisons | Good for a *global* leaderboard later; `comparisons` already logs the raw data. Not for personal lists, where insertion is exact and cheaper. |
| Ranking menu instances | Rank "FFC tikka on Nov 18" | Captures day-to-day quality swings, but lists fill with duplicates. Could show as "last time it was…" on the dish instead. |

Possible follow-ups: global Elo from `comparisons` for the landing page sort; "quick rate" (verdict only, placed at the middle of its band) for people who don't want comparisons; re-asking a comparison when two adjacent dishes were placed far apart in time.

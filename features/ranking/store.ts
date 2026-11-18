// The only place the UI reads or saves meals and rankings.
// For now it uses this browser's localStorage, seeded from mock-data.ts.
// Each write mirrors a Supabase RPC (log_meal, rank_dish) or a single-row
// update, so moving to Supabase should only mean rewriting this file.

import { getSentimentGroup, SENTIMENT_ORDER } from "./insertion";
import { CURRENT_USER_ID, rankings as mockRankings, seedDishes } from "./mock-data";
import { sentimentScore } from "./score";
import type {
  Comparison,
  Dish,
  Meal,
  MealDish,
  MealType,
  MealWithDishes,
  RankedDish,
  Ranking,
  RankStatus,
  Sentiment,
} from "./types";
import type { HallSlug } from "@/lib/halls";

const RANKINGS_KEY = "slopkins.rankings.v2";
const COMPARISONS_KEY = "slopkins.comparisons.v2";
const MEALS_KEY = "slopkins.meals.v2";
const MEAL_DISHES_KEY = "slopkins.meal-dishes.v2";
// Menus are fetched live, so keep a copy of every dish that gets logged.
// Stands in for the dishes table until the ingest fills it.
const DISHES_KEY = "slopkins.dishes.v2";

function read<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key}`, error);
  }
}

function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export function getCurrentUserId(): string {
  return CURRENT_USER_ID;
}

export function getDish(id: number): Dish | undefined {
  return read<Dish>(DISHES_KEY, seedDishes).find((dish) => dish.id === id);
}

/** Adds or refreshes dishes in the local catalog. */
function saveDishes(dishes: Dish[]): void {
  const ids = new Set(dishes.map((dish) => dish.id));
  write(DISHES_KEY, [...read<Dish>(DISHES_KEY, seedDishes).filter((d) => !ids.has(d.id)), ...dishes]);
}

// ------------------------------------------------------------
// Rankings
// ------------------------------------------------------------

/** A user's list, best dish first, with rank and dish details attached. */
export function getRankedDishes(userId: string): RankedDish[] {
  const own = read<Ranking>(RANKINGS_KEY, mockRankings).filter((r) => r.user_id === userId);
  return SENTIMENT_ORDER.flatMap((s) =>
    own.filter((r) => r.sentiment === s).sort((a, b) => b.score - a.score),
  ).flatMap((ranking, index) => {
    const dish = getDish(ranking.dish_id);
    return dish ? [{ ...ranking, rank: index + 1, dish }] : [];
  });
}

export type RankDishInput = {
  userId: string;
  dishId: number;
  sentiment: Sentiment;
  /** 0-based index in the sentiment group, not counting this dish. */
  position: number;
  comment: string | null;
  mealId: number | null;
  comparisons: { winner_dish_id: number; loser_dish_id: number }[];
};

/** Mirrors rank_dish(): places the dish, re-spreads scores, marks the meal row. */
export function rankDish(input: RankDishInput): void {
  const now = new Date().toISOString();
  const all = read<Ranking>(RANKINGS_KEY, mockRankings);
  const existing = all.find((r) => r.user_id === input.userId && r.dish_id === input.dishId);
  const list = getRankedDishes(input.userId).filter((r) => r.dish_id !== input.dishId);

  const group = getSentimentGroup(list, input.sentiment);
  const ordered: Ranking[] = [
    ...group.slice(0, input.position),
    {
      user_id: input.userId,
      dish_id: input.dishId,
      sentiment: input.sentiment,
      score: 0,
      comment: input.comment ?? existing?.comment ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    },
    ...group.slice(input.position),
  ];
  const respread = new Map<number, Ranking>(
    ordered.map((r, i) => [
      r.dish_id,
      { ...stripRank(r), score: sentimentScore(input.sentiment, i, ordered.length) },
    ]),
  );

  // The dish left its old group: close the gap.
  if (existing && existing.sentiment !== input.sentiment) {
    const oldGroup = getSentimentGroup(list, existing.sentiment);
    oldGroup.forEach((r, i) =>
      respread.set(r.dish_id, {
        ...stripRank(r),
        score: sentimentScore(existing.sentiment, i, oldGroup.length),
      }),
    );
  }

  const untouched = all.filter(
    (r) => !(r.user_id === input.userId && (respread.has(r.dish_id) || r.dish_id === input.dishId)),
  );
  write(RANKINGS_KEY, [...untouched, ...respread.values()]);

  const comparisons = read<Comparison>(COMPARISONS_KEY, []);
  let id = nextId(comparisons);
  write(COMPARISONS_KEY, [
    ...comparisons,
    ...input.comparisons.map((c) => ({ id: id++, user_id: input.userId, ...c, created_at: now })),
  ]);

  if (input.mealId !== null) setRankStatus(input.mealId, input.dishId, "ranked");
}

function stripRank(r: Ranking | RankedDish): Ranking {
  return {
    user_id: r.user_id,
    dish_id: r.dish_id,
    sentiment: r.sentiment,
    score: r.score,
    comment: r.comment,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ------------------------------------------------------------
// Meals
// ------------------------------------------------------------

export type LogMealInput = {
  userId: string;
  hallSlug: HallSlug;
  meal: MealType | null;
  /** The dishes as shown on the menu, with rankable set from isMain. */
  dishes: Dish[];
  /** false is "log without ranking": rankable dishes start skipped. */
  rank: boolean;
};

/** Mirrors log_meal(). Returns the new meal's id. */
export function logMeal(input: LogMealInput): number {
  saveDishes(input.dishes);
  const meals = read<Meal>(MEALS_KEY, []);
  const meal: Meal = {
    id: nextId(meals),
    user_id: input.userId,
    hall_slug: input.hallSlug,
    meal: input.meal,
    created_at: new Date().toISOString(),
  };
  write(MEALS_KEY, [...meals, meal]);

  const rows: MealDish[] = input.dishes.map((dish) => {
    const rank_status: RankStatus = !dish.rankable
      ? "unrankable"
      : input.rank
        ? "pending"
        : "skipped";
    return { meal_id: meal.id, dish_id: dish.id, rank_status };
  });
  write(MEAL_DISHES_KEY, [...read<MealDish>(MEAL_DISHES_KEY, []), ...rows]);

  return meal.id;
}

export function getMeal(mealId: number): MealWithDishes | null {
  const meal = read<Meal>(MEALS_KEY, []).find((m) => m.id === mealId);
  if (!meal) return null;
  const rows = read<MealDish>(MEAL_DISHES_KEY, []).filter((row) => row.meal_id === mealId);
  return {
    ...meal,
    dishes: rows.flatMap((row) => {
      const dish = getDish(row.dish_id);
      return dish ? [{ ...row, dish }] : [];
    }),
  };
}

/** Skip a dish, keep an existing ranking, or put a skipped dish back in the queue. */
export function setRankStatus(mealId: number, dishId: number, status: RankStatus): void {
  write(
    MEAL_DISHES_KEY,
    read<MealDish>(MEAL_DISHES_KEY, []).map((row) =>
      row.meal_id === mealId && row.dish_id === dishId && row.rank_status !== "unrankable"
        ? { ...row, rank_status: status }
        : row,
    ),
  );
}

/** A user's meals that still have dishes waiting to be ranked, newest first. */
export function getMealsWithPendingDishes(userId: string): MealWithDishes[] {
  const pendingMealIds = new Set(
    read<MealDish>(MEAL_DISHES_KEY, [])
      .filter((row) => row.rank_status === "pending")
      .map((row) => row.meal_id),
  );
  return read<Meal>(MEALS_KEY, [])
    .filter((meal) => meal.user_id === userId && pendingMealIds.has(meal.id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .flatMap((meal) => getMeal(meal.id) ?? []);
}

/** Throws away saved changes and goes back to the mock data. */
export function resetToMockData(): void {
  try {
    for (const key of [RANKINGS_KEY, COMPARISONS_KEY, MEALS_KEY, MEAL_DISHES_KEY, DISHES_KEY]) {
      localStorage.removeItem(key);
    }
  } catch {
    // Nothing saved, so nothing to reset.
  }
}

// The only place the UI reads or saves ranking data.
// For now it uses this browser's localStorage, seeded from mock-data.ts.
// Moving to Supabase should only mean rewriting this file.

import { insertDish } from "./insertion";
import {
  CURRENT_USER_ID,
  comparisons as mockComparisons,
  diningHalls,
  dishes,
  rankings as mockRankings,
} from "./mock-data";
import type {
  Comparison,
  DiningHall,
  DiningHallId,
  Dish,
  RankedDish,
  Ranking,
  Sentiment,
} from "./types";

const RANKINGS_KEY = "slopkins.rankings.v1";
const COMPARISONS_KEY = "slopkins.comparisons.v1";

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

export function getCurrentUserId(): string {
  return CURRENT_USER_ID;
}

export function getDiningHalls(): DiningHall[] {
  return diningHalls;
}

export function getDiningHall(id: DiningHallId): DiningHall {
  return diningHalls.find((hall) => hall.id === id)!;
}

/** A user's list, best dish first, with dish and hall details attached. */
export function getRankedDishes(userId: string): RankedDish[] {
  return read<Ranking>(RANKINGS_KEY, mockRankings)
    .filter((ranking) => ranking.user_id === userId)
    .sort((a, b) => a.rank - b.rank)
    .flatMap((ranking) => {
      const dish = dishes.find((d) => d.id === ranking.dish_id);
      return dish ? [{ ...ranking, dish, hall: getDiningHall(dish.hall_id) }] : [];
    });
}

/** Dishes a user hasn't ranked yet. */
export function getUnrankedDishes(userId: string): Dish[] {
  const rankedIds = new Set(getRankedDishes(userId).map((r) => r.dish_id));
  return dishes.filter((dish) => !rankedIds.has(dish.id));
}

export type NewRanking = {
  userId: string;
  dish: Dish;
  sentiment: Sentiment;
  rank: number;
  comment: string | null;
  answers: { winner_dish_id: string; loser_dish_id: string }[];
};

/** Adds a dish to a user's list and records the comparisons that placed it. */
export function saveRanking(input: NewRanking): void {
  const now = new Date().toISOString();
  const newDish: RankedDish = {
    user_id: input.userId,
    dish_id: input.dish.id,
    rank: input.rank,
    sentiment: input.sentiment,
    comment: input.comment,
    created_at: now,
    dish: input.dish,
    hall: getDiningHall(input.dish.hall_id),
  };
  const updatedList = insertDish(getRankedDishes(input.userId), newDish);

  const otherUsers = read<Ranking>(RANKINGS_KEY, mockRankings).filter(
    (ranking) => ranking.user_id !== input.userId,
  );
  const updatedRankings: Ranking[] = updatedList.map((item) => ({
    user_id: item.user_id,
    dish_id: item.dish_id,
    rank: item.rank,
    sentiment: item.sentiment,
    comment: item.comment,
    created_at: item.created_at,
  }));
  write(RANKINGS_KEY, [...otherUsers, ...updatedRankings]);

  const newComparisons: Comparison[] = input.answers.map((answer) => ({
    id: crypto.randomUUID(),
    user_id: input.userId,
    ...answer,
    created_at: now,
  }));
  write(COMPARISONS_KEY, [
    ...read<Comparison>(COMPARISONS_KEY, mockComparisons),
    ...newComparisons,
  ]);
}

/** Throws away saved changes and goes back to the mock data. */
export function resetToMockData(): void {
  try {
    localStorage.removeItem(RANKINGS_KEY);
    localStorage.removeItem(COMPARISONS_KEY);
  } catch {
    // Nothing saved, so nothing to reset.
  }
}

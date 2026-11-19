// Invented placeholder data, not real students. Seeds the demo user's list so
// there's something to compare against. Real dishes come from the live menus
// (lib/menus.ts) and are saved by the store when a meal is logged.
// Delete this once rankings come from Supabase.

import { sentimentScore } from "./score";
import type { Dish, Ranking, Sentiment } from "./types";

// Stands in for the signed-in user until auth is wired into ranking.
export const CURRENT_USER_ID = "user-me";

// Ids far above Nutrislice's so they never collide with a real dish.
export const seedDishes: Dish[] = [
  { id: 900_000_001, name: "Cheeseburger", station: "Grill", calories: 540, rankable: true, hall_slug: "ffc" },
  { id: 900_000_002, name: "General Tso's Chicken", station: "Wok", calories: 560, rankable: true, hall_slug: "levering" },
  { id: 900_000_003, name: "Philly Cheesesteak", station: "Grill", calories: 620, rankable: true, hall_slug: "nolans" },
  { id: 900_000_004, name: "Margherita Pizza", station: "Pizza", calories: 280, rankable: true, hall_slug: "ffc" },
  { id: 900_000_005, name: "Pesto Pasta", station: "Pasta", calories: 410, rankable: true, hall_slug: "nolans" },
  { id: 900_000_006, name: "Vegetable Lo Mein", station: "Wok", calories: 400, rankable: true, hall_slug: "levering" },
];

/** The demo user's list, best first within each sentiment. */
const seed: Record<Sentiment, { dish_id: number; comment: string | null }[]> = {
  liked: [
    { dish_id: 900_000_001, comment: "Worth the line every time." },
    { dish_id: 900_000_002, comment: null },
    { dish_id: 900_000_003, comment: "Peak at 1am." },
  ],
  fine: [
    { dish_id: 900_000_004, comment: "Great when it's fresh out of the oven." },
    { dish_id: 900_000_005, comment: null },
  ],
  disliked: [{ dish_id: 900_000_006, comment: "Needs more sauce." }],
};

const seededAt = "2026-10-01T17:00:00Z";

export const rankings: Ranking[] = (Object.keys(seed) as Sentiment[]).flatMap((sentiment) =>
  seed[sentiment].map((entry, position, group) => ({
    user_id: CURRENT_USER_ID,
    dish_id: entry.dish_id,
    sentiment,
    score: sentimentScore(sentiment, position, group.length),
    comment: entry.comment,
    created_at: seededAt,
    updated_at: seededAt,
  })),
);

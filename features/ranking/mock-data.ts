// Invented placeholder data, not real students. Dishes come from the dining
// mock menus so a logged meal and a ranked dish share ids.
// Swap these reads for Supabase queries once auth and the ingest land.

import { mockMenus } from "@/lib/mock-data";
import type { HallSlug } from "@/lib/halls";
import { sentimentScore } from "./score";
import type { Dish, Ranking, Sentiment } from "./types";

// Stands in for the signed-in user until auth exists.
export const CURRENT_USER_ID = "user-me";

export const dishes: Dish[] = (Object.keys(mockMenus) as HallSlug[]).flatMap((hallSlug) =>
  mockMenus[hallSlug].flatMap((tab) => tab.dishes.map((dish) => ({ ...dish, hall_slug: hallSlug }))),
);

/** The demo user's list, best first within each sentiment. */
const seed: Record<Sentiment, { dish_id: number; comment: string | null }[]> = {
  liked: [
    { dish_id: 11, comment: "Worth the line every time." },
    { dish_id: 25, comment: null },
    { dish_id: 18, comment: "Peak at 1am." },
  ],
  fine: [
    { dish_id: 7, comment: "Great when it's fresh out of the oven." },
    { dish_id: 17, comment: null },
  ],
  disliked: [{ dish_id: 26, comment: "Needs more sauce." }],
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

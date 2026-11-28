// Same building blocks as the dining and feed pages.
import type { Sentiment } from "../types";

export const SENTIMENT_LABELS: Record<Sentiment, { heading: string; prompt: string }> = {
  liked: { heading: "Liked", prompt: "Liked it" },
  fine: { heading: "Fine", prompt: "It was fine" },
  disliked: { heading: "Didn't like", prompt: "Didn't like it" },
};

/**
 * Score colors. `score`: a filled badge (menus, ranked lists). `number`: just
 * the number's color, for the gray-ringed circle on feed posts.
 */
export const SENTIMENT_STYLES: Record<Sentiment, { score: string; number: string }> = {
  liked: { score: "bg-emerald-500 text-white", number: "text-emerald-600" },
  fine: { score: "bg-amber-400 text-white", number: "text-amber-600" },
  disliked: { score: "bg-rose-500 text-white", number: "text-rose-600" },
};

export const primaryButton =
  "block w-full rounded-md bg-brand py-3 text-center font-semibold text-on-brand transition hover:bg-brand/90 disabled:opacity-40";
export const secondaryButton =
  "block w-full rounded-md border border-gray-200 py-3 text-center font-semibold transition hover:bg-gray-50";

/** A bordered list, like the menu and hall lists. */
export const listBox = "divide-y divide-gray-100 rounded-2xl border border-gray-200";

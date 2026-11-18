// Same building blocks as the dining and feed pages.
import type { Sentiment } from "../types";

export const SENTIMENT_LABELS: Record<Sentiment, { heading: string; prompt: string }> = {
  liked: { heading: "Liked", prompt: "Liked it" },
  fine: { heading: "Fine", prompt: "It was fine" },
  disliked: { heading: "Didn't like", prompt: "Didn't like it" },
};

/** Score badge colors, used by the profile page's ranked list. */
export const SENTIMENT_STYLES: Record<Sentiment, { score: string }> = {
  liked: { score: "bg-emerald-500 text-white" },
  fine: { score: "bg-amber-400 text-white" },
  disliked: { score: "bg-rose-500 text-white" },
};

export const primaryButton =
  "block w-full rounded-md bg-blue-600 py-3 text-center font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40";
export const secondaryButton =
  "block w-full rounded-md border border-gray-200 py-3 text-center font-semibold transition hover:bg-gray-50";

/** A bordered list, like the menu and hall lists. */
export const listBox = "divide-y divide-gray-100 rounded-2xl border border-gray-200";
export const sectionHeading = "text-sm font-semibold uppercase tracking-wide text-gray-400";

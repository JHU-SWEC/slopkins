import type { DiningHallId, Sentiment } from "../types";

export const SENTIMENT_STYLES: Record<
  Sentiment,
  {
    heading: string;
    prompt: string;
    description: string;
    emoji: string;
    badge: string;
    score: string;
    choice: string;
  }
> = {
  liked: {
    heading: "Liked",
    prompt: "I liked it",
    description: "Would get it again",
    emoji: "😋",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    score: "bg-emerald-500 text-white",
    choice: "hover:border-emerald-400 hover:bg-emerald-50/70",
  },
  fine: {
    heading: "Fine",
    prompt: "It was fine",
    description: "Edible, not memorable",
    emoji: "😐",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
    score: "bg-amber-400 text-white",
    choice: "hover:border-amber-400 hover:bg-amber-50/70",
  },
  disliked: {
    heading: "Didn't like",
    prompt: "I didn't like it",
    description: "Never again",
    emoji: "🤢",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    score: "bg-rose-500 text-white",
    choice: "hover:border-rose-400 hover:bg-rose-50/70",
  },
};

export const HALL_STYLES: Record<DiningHallId, string> = {
  ffc: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
  nolans: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20",
  levering: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
};

/** Johns Hopkins Heritage Blue. */
export const BRAND_BG = "bg-[#002D72]";
export const BRAND_TEXT = "text-[#002D72]";

export const primaryButton =
  "inline-flex items-center justify-center rounded-xl bg-[#002D72] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#001f52] active:scale-[0.98]";
export const secondaryButton =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]";

/** Fades a card in when it first appears. */
export const enter = "transition duration-300 ease-out starting:translate-y-2 starting:opacity-0";

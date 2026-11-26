import Link from "next/link";
import type { FeedPost } from "@/features/feed/queries";
import { formatScore } from "../score";
import type { Sentiment } from "../types";
import { SENTIMENT_STYLES, primaryButton } from "./styles";

/** Average of the dishes this person has scored on the plate, or null if none. */
function plateScore(plate: FeedPost): number | null {
  const scores = plate.dishes.flatMap((dish) => (dish.ranking ? [dish.ranking.score] : []));
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/** Same bands as dish scores (score.ts), so the average gets a matching color. */
function bandOf(score: number): Sentiment {
  if (score > 7) return "liked";
  if (score > 4) return "fine";
  return "disliked";
}

/** Colored text for the plate's score, matching the dish score colors. */
const SCORE_TEXT: Record<Sentiment, string> = {
  liked: "text-emerald-500",
  fine: "text-amber-500",
  disliked: "text-rose-500",
};

/**
 * Plates (logged meals) ranked best first by the average score of their dishes.
 * Shown under "Ranked Plates" on every profile; `isOwner` changes the empty state.
 */
export default function MyList({ plates, isOwner }: { plates: FeedPost[]; isOwner: boolean }) {
  const ranked = plates
    .flatMap((plate) => {
      const score = plateScore(plate);
      return score === null ? [] : [{ plate, score }];
    })
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return isOwner ? (
      <div className="mt-6 text-center">
        <p className="text-gray-500">Log a meal to start ranking dishes.</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Browse menus
        </Link>
      </div>
    ) : (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        No dishes ranked yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {ranked.map(({ plate, score }, index) => (
        <li
          key={plate.id}
          // The guided tour points at your #1 plate.
          data-tour={isOwner && index === 0 ? "my-list" : undefined}
          className="flex items-center gap-4 rounded-2xl border border-gray-200 px-4 py-4 transition hover:border-gray-300"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500 tabular-nums">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {plate.hall?.name ?? "A dining hall"}
              {plate.meal && <span className="capitalize"> · {plate.meal}</span>}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(plate.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "America/New_York",
              })}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {plate.dishes.map((dish) => (
                <li
                  key={dish.id}
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-2.5 pr-1 text-xs text-gray-700"
                >
                  {dish.name}
                  {dish.ranking ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-semibold tabular-nums ${
                        SENTIMENT_STYLES[dish.ranking.sentiment].score
                      }`}
                    >
                      {formatScore(dish.ranking.score)}
                    </span>
                  ) : (
                    <span className="pr-1.5" />
                  )}
                </li>
              ))}
            </ul>
          </div>
          {/* The plate's score: the average of its dishes. */}
          <span className={`shrink-0 text-xl font-bold tabular-nums ${SCORE_TEXT[bandOf(score)]}`}>
            {formatScore(score)}
          </span>
        </li>
      ))}
    </ol>
  );
}

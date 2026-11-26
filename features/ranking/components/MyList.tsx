import Link from "next/link";
import type { FeedPost } from "@/features/feed/queries";
import { mealDate } from "../format";
import { formatScore } from "../score";
import type { Sentiment } from "../types";
import { primaryButton } from "./styles";

/** Colored text for the plate's score, matching the score bubble colors. */
const SCORE_TEXT: Record<Sentiment, string> = {
  liked: "text-emerald-500",
  fine: "text-amber-500",
  disliked: "text-rose-500",
};

/**
 * Ranked plates (logged meals), best first by the plate's score.
 * Shown under "Ranked Plates" on every profile; `isOwner` changes the empty state.
 */
export default function MyList({ plates, isOwner }: { plates: FeedPost[]; isOwner: boolean }) {
  // Scores sit in non-overlapping sentiment bands, so score order is list order.
  const ranked = plates
    .flatMap((plate) => (plate.ranking ? [{ plate, ranking: plate.ranking }] : []))
    .sort((a, b) => b.ranking.score - a.ranking.score);

  if (ranked.length === 0) {
    return isOwner ? (
      <div className="mt-6 text-center">
        <p className="text-gray-500">Log a meal to start ranking plates.</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Browse menus
        </Link>
      </div>
    ) : (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        No plates ranked yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {ranked.map(({ plate, ranking }, index) => (
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
            <p className="text-sm text-gray-500">{mealDate(plate.at)}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {plate.dishes.map((dish) => (
                <li key={dish.id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                  {dish.name}
                </li>
              ))}
            </ul>
          </div>
          {/* The plate's score. */}
          <span className={`shrink-0 text-xl font-bold tabular-nums ${SCORE_TEXT[ranking.sentiment]}`}>
            {formatScore(ranking.score)}
          </span>
        </li>
      ))}
    </ol>
  );
}

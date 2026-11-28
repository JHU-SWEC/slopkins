"use client";

import { useState } from "react";
import { mealDate, mealTitle } from "../format";
import type { RankedPlate } from "../types";
import { EmptyTab, LIST_BOX, LIST_ROW, ListCount, PlateThumb, RowText } from "./list-row";
import { ScoreCircle } from "./score-circle";

type Order = "best" | "worst";

/**
 * The profile's Rankings tab: every ranked plate as one numbered list, like
 * Beli's, with a Best | Worst switch. A plate's number is always its spot on
 * the list (#1 = best), whichever way it's shown. Activity is the separate tab
 * for posts in time order.
 *
 * `plates` is the whole list from getRankedPlates (best first, with ranks), not
 * the profile's posts, which stop at the 30 newest.
 */
export function RankingsList({ plates, isOwner }: { plates: RankedPlate[]; isOwner: boolean }) {
  const [order, setOrder] = useState<Order>("best");

  if (plates.length === 0) {
    return isOwner ? (
      <EmptyTab message="Plates you rank will show up here, best first." action={{ label: "Log a meal", href: "/dining" }} />
    ) : (
      <EmptyTab message="No plates ranked yet." />
    );
  }

  const shown = order === "best" ? plates : [...plates].reverse();

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <ListCount count={plates.length} one="plate" many="plates" />
        {/* A quiet text sort, like Letterboxd's or Spotify's: tap to flip the order. */}
        {plates.length > 1 && (
          <button
            type="button"
            onClick={() => setOrder(order === "best" ? "worst" : "best")}
            aria-label={`Showing ${order === "best" ? "best" : "worst"} first. Show ${order === "best" ? "worst" : "best"} first`}
            className="-mr-1 flex items-center gap-1.5 rounded-md px-1 py-1 text-sm text-gray-500 transition hover:text-gray-800"
          >
            <span>
              <span className="font-semibold text-gray-700">{order === "best" ? "Best" : "Worst"}</span> first
            </span>
            {/* Up/down arrows; the one pointing the current way is darker. */}
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13V3M2.5 5.5 5 3l2.5 2.5" className={order === "worst" ? "text-gray-800" : "text-gray-300"} />
              <path d="M11 3v10M8.5 10.5 11 13l2.5-2.5" className={order === "best" ? "text-gray-800" : "text-gray-300"} />
            </svg>
          </button>
        )}
      </div>
      {/* One joined box: it's a single list, unlike Activity's separate posts. */}
      <ol className={LIST_BOX}>
        {shown.map((plate) => (
          <li
            key={plate.meal_id}
            // The guided tour points at your #1 plate.
            data-tour={isOwner && plate.rank === 1 ? "my-list" : undefined}
            className={LIST_ROW}
          >
            {/* Plain numbers (a circle here would compete with the score's); top 3 in brand blue. */}
            <span
              className={`w-7 shrink-0 text-center text-lg font-bold tabular-nums ${
                plate.rank <= 3 ? "text-brand" : "text-gray-400"
              }`}
            >
              {plate.rank}
            </span>
            <PlateThumb photoPath={plate.photo_path} />
            <RowText
              title={mealTitle(plate)}
              detail={[mealDate(plate.created_at), plate.dish_names.join(", ")].filter(Boolean).join(" · ")}
            />
            <ScoreCircle score={plate.score} sentiment={plate.sentiment} size="sm" look="ring" />
          </li>
        ))}
      </ol>
    </>
  );
}

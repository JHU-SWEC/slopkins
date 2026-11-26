"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setPlateSaved } from "./actions";

// Bookmark on someone else's post: saves the whole plate to your Want to Try
// list as one entry, with how many people have saved it. Flips the moment you
// tap it, then the server catches up (same pattern as LikeButton).
export function SavePlateButton({ mealId, saved, saves }: { mealId: number; saved: boolean; saves: number }) {
  const [optimistic, setOptimistic] = useOptimistic({ saved, saves });
  const shown = optimistic.saved;
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    const next = !shown;
    setError("");
    startTransition(async () => {
      setOptimistic({ saved: next, saves: Math.max(0, optimistic.saves + (next ? 1 : -1)) });
      const result = await setPlateSaved(mealId, next);
      if (result.error) setError(result.error);
    });
  }

  // A fragment, so the button sits with the like and comment icons and the
  // count can push itself to the right end of that row.
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={shown}
        aria-label={shown ? "Remove from Want to Try" : "Save plate to Want to Try"}
        title={shown ? "Saved to Want to Try" : "Save to Want to Try"}
        className={`grid size-11 place-items-center rounded-full transition hover:bg-gray-100 ${
          shown ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        {/* Same bookmark as the menu's Want to Try toggle. */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-6"
          fill={shown ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        >
          <path d="M6 3h12v18l-6-4-6 4V3z" />
        </svg>
      </button>
      {error && (
        <span role="alert" className="ml-1 text-xs text-rose-600">
          {error}
        </span>
      )}
      <SaveCount saves={optimistic.saves} />
    </>
  );
}

/** "3 bookmarks", on the right end of the post's icon row. */
export function SaveCount({ saves }: { saves: number }) {
  if (saves <= 0) return null;
  return (
    <span className="ml-auto pr-1 text-sm font-medium text-gray-600 tabular-nums">
      {saves} {saves === 1 ? "bookmark" : "bookmarks"}
    </span>
  );
}

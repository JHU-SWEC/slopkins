"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ActionSlot } from "./action-count";
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

  // A fragment, so the bookmark and its count sit at the right end of the row
  // with the like and comment icons.
  return (
    <>
      {/* Before the bookmark, since the bookmark sits at the card's right edge. */}
      {error && (
        <span role="alert" className="ml-auto text-xs text-red-600">
          {error}
        </span>
      )}
      <ActionSlot count={optimistic.saves} end>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={shown}
          aria-label={(shown ? "Remove from Want to Try" : "Save plate to Want to Try") + savedBy(optimistic.saves)}
          title={shown ? "Saved to Want to Try" : "Save to Want to Try"}
          className={`grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-gray-100 ${
            shown ? "text-spirit-blue" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <BookmarkIcon filled={shown} />
        </button>
      </ActionSlot>
    </>
  );
}

/**
 * Your own post: you can't bookmark it, so this is a plain bookmark with how
 * many people saved it, shown once someone has.
 */
export function SaveCount({ saves }: { saves: number }) {
  if (saves <= 0) return null;
  return (
    <ActionSlot count={saves} end>
      <span
        role="img"
        aria-label={`Saved${savedBy(saves)}`}
        title="Saved to Want to Try"
        className="grid size-11 shrink-0 place-items-center text-gray-400"
      >
        <BookmarkIcon filled={false} />
      </span>
    </ActionSlot>
  );
}

// " (saved by 3 people)", for screen readers: the number beside the icon is hidden from them.
function savedBy(saves: number) {
  return saves > 0 ? ` (saved by ${saves} ${saves === 1 ? "person" : "people"})` : "";
}

// Same bookmark as the menu's Want to Try toggle.
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinejoin="round"
    >
      <path d="M6 3h12v18l-6-4-6 4V3z" />
    </svg>
  );
}

"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setLiked } from "./actions";

// Heart and like count under a feed post. Flips the moment you tap it, then
// the server catches up (same pattern as FollowButton).
export function LikeButton({ mealId, liked, likes }: { mealId: number; liked: boolean; likes: number }) {
  const [shown, setShown] = useOptimistic({ liked, likes });
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    const next = !shown.liked;
    setError("");
    startTransition(async () => {
      setShown({ liked: next, likes: shown.likes + (next ? 1 : -1) });
      const result = await setLiked(mealId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={shown.liked}
        aria-label={shown.liked ? "Unlike" : "Like"}
        className={`-ml-2.5 grid size-11 place-items-center rounded-full transition hover:bg-gray-100 ${
          shown.liked ? "text-rose-500" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={shown.liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-6"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>
      {shown.likes > 0 && (
        <span className="text-sm font-medium text-gray-600 tabular-nums">
          {shown.likes} {shown.likes === 1 ? "like" : "likes"}
        </span>
      )}
      {error && (
        <span role="alert" className="ml-3 text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}

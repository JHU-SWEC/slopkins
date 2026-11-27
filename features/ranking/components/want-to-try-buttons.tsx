"use client";

import { useState, useTransition } from "react";
import { removeSavedPlate } from "@/features/feed/actions";
import { removeWantToTryAction, setWantToTryAction } from "../actions";

/** Bookmark outline, filled when saved. */
function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
      <path d="M6 3h12v18l-6-4-6 4V3z" />
    </svg>
  );
}

/**
 * The bookmark next to a dish on a menu. The menu owns the saved state (a dish
 * can be listed twice: under Mains and under its station), so this flips it
 * right away and flips it back if the save fails.
 */
export function WantToTryToggle({
  hallSlug,
  menuTypeSlug,
  date,
  foodId,
  name,
  saved,
  onChange,
}: {
  hallSlug: string;
  menuTypeSlug: string;
  date: string;
  foodId: number;
  name: string;
  saved: boolean;
  onChange: (saved: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !saved;
    onChange(next);
    setError(null);
    startTransition(async () => {
      const result = await setWantToTryAction({ hallSlug, menuTypeSlug, date, foodId, save: next });
      if (result.error) {
        onChange(!next);
        setError(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from want to try` : `Save ${name} to want to try`}
      title={error ?? (saved ? "On your Want to try list" : "Save to Want to try")}
      className={`rounded-full p-1.5 transition hover:bg-spirit-blue/10 ${
        error ? "text-red-500" : saved ? "text-spirit-blue" : "text-gray-300 hover:text-spirit-blue"
      }`}
    >
      <BookmarkIcon filled={saved} />
    </button>
  );
}

/** "Remove" on the profile's Want to try list. */
export function RemoveWantToTry({ dishId, name }: { dishId: number; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await removeWantToTryAction(dishId)))}
      aria-label={`Remove ${name} from want to try`}
      className="shrink-0 text-sm text-gray-500 transition hover:text-gray-700 disabled:opacity-40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

/** "Remove" on a plate saved from someone's post. */
export function RemoveSavedPlate({ plateId }: { plateId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await removeSavedPlate(plateId)))}
      aria-label="Remove this plate from want to try"
      className="shrink-0 text-sm text-gray-500 transition hover:text-gray-700 disabled:opacity-40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

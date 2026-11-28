"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { setFollowing } from "./actions";

// Instagram-style button: "Follow" / "Follow back" (filled) or "Following" (outlined).
// It flips the moment you tap it, then the server catches up.
export function FollowButton({
  targetId,
  username,
  following,
  followsMe,
  signedIn,
  tone = "light",
  size = "regular",
  className = "",
}: {
  targetId: string;
  username: string;
  /** You follow them right now. */
  following: boolean;
  /** They follow you (shows "Follow back"). */
  followsMe: boolean;
  signedIn: boolean;
  /** "dark" = on the blue profile header. */
  tone?: "light" | "dark";
  /** "compact" = a small, softly rounded button (like Instagram's) for the top right of a profile. */
  size?: "regular" | "compact";
  className?: string;
}) {
  const [shown, setShown] = useOptimistic(following);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filled =
    tone === "dark"
      ? "bg-white text-heritage-blue hover:bg-white/90"
      : "bg-brand text-on-brand hover:bg-brand/90";
  const outlined =
    tone === "dark"
      ? "border border-white/40 text-white hover:bg-white/10"
      : "border border-gray-300 bg-white text-heritage-blue hover:bg-gray-50 dark:border-white/30 dark:bg-transparent dark:text-white dark:hover:bg-white/10";
  const shape = size === "compact" ? "inline-flex h-9 items-center rounded-lg px-4" : "rounded-xl px-4 py-2";
  const base = `group ${shape} text-sm font-semibold whitespace-nowrap transition ${className}`;

  // Signed-out visitors get sent to log in first.
  if (!signedIn) {
    return (
      <Link href="/login" className={`${base} ${filled}`}>
        Follow
      </Link>
    );
  }

  function toggle() {
    const next = !shown;
    setError("");
    startTransition(async () => {
      setShown(next);
      const result = await setFollowing(targetId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={shown}
        aria-label={shown ? `Unfollow @${username}` : `Follow @${username}`}
        className={`${base} ${shown ? outlined : filled}`}
      >
        {shown ? (
          // Says "Unfollow" while you hover (mice only; phones never hover), like X.
          <>
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline">Unfollow</span>
          </>
        ) : followsMe ? (
          "Follow back"
        ) : (
          "Follow"
        )}
      </button>
      {error && (
        <span role="alert" className={`mt-1 text-xs ${tone === "dark" ? "text-red-200" : "text-red-700"}`}>
          {error}
        </span>
      )}
    </span>
  );
}

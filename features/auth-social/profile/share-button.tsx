"use client";

import { useState } from "react";

// On phones this opens the built-in share sheet (Messages, Instagram, etc.).
// On computers it copies the profile link instead, and says so in a small bubble.
export function ShareButton({ username, className }: { username: string; className: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function share() {
    const url = `${window.location.origin}/u/${username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `@${username} on Slopkins`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch (error) {
      // Closing the share sheet counts as an "error"; ignore that one.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <span className="relative">
      <button type="button" onClick={share} aria-label="Share profile" title="Share profile" className={className}>
        {/* Share: a box with an arrow coming up out of it. */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="M7.5 7.5 12 3l4.5 4.5" />
          <path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" />
        </svg>
      </button>
      <span
        aria-live="polite"
        className={`pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow transition dark:text-slate-50 ${
          status === "idle" ? "opacity-0" : "opacity-100"
        }`}
      >
        {status === "copied" ? "Link copied!" : status === "failed" ? "Couldn't copy" : ""}
      </span>
    </span>
  );
}

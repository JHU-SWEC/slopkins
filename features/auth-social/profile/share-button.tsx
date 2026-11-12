"use client";

import { useState } from "react";

// On phones this opens the built-in share sheet (Messages, Instagram, etc.).
// On computers it copies the profile link instead.
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
    <button type="button" onClick={share} className={className}>
      <span aria-live="polite">
        {status === "copied" ? "Link copied!" : status === "failed" ? "Couldn't copy" : "Share profile"}
      </span>
    </button>
  );
}

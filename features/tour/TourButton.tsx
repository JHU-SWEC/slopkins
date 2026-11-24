"use client";

import { startTour } from "./Tour";

// Replays the tour. Sits left of the theme toggle and matches its look.
export function TourButton() {
  return (
    <button
      type="button"
      onClick={startTour}
      aria-label="How Slopkins works"
      title="How Slopkins works"
      className="fixed right-14 top-3 z-50 grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-base font-semibold text-gray-600 shadow-sm transition hover:bg-gray-100"
    >
      ?
    </button>
  );
}

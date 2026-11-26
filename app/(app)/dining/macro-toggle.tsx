"use client";

import { HoverLabel } from "@/app/hover-label";
import { setShowMacros, useShowMacros } from "./use-macros";

// Shows or hides calories and macros on the dining pages. Phones: the row
// along the top right is settings, tour, notifications, then this. Laptops:
// those live in the sidebar, so this takes the corner.
export function MacroToggle() {
  const show = useShowMacros();
  const label = show ? "Hide macros" : "Show macros";

  return (
    <button
      type="button"
      onClick={() => setShowMacros(!show)}
      aria-pressed={show}
      aria-label={label}
      className={`group fixed right-[144px] top-3 z-50 md:right-3 grid h-9 w-9 place-items-center rounded-full border shadow-sm transition hover:bg-gray-100 ${
        show ? "border-gray-200 bg-white text-gray-600" : "border-gray-200 bg-gray-100 text-gray-400"
      }`}
    >
      {/* Bar chart; struck through while macros are hidden. */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M6 20v-6M12 20V8M18 20V4" />
        {!show && <path d="M3 3l18 18" />}
      </svg>
      <HoverLabel>{label}</HoverLabel>
    </button>
  );
}

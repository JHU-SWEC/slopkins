"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { TourStep } from "./steps";

// floor: the lowest point the spotlight and card may use (above fixed bars).
type Rect = { top: number; left: number; width: number; height: number; floor: number };

// Gap between the highlighted element and the spotlight edge, and between the
// spotlight and the card.
const PAD = 6;
const GAP = 12;
const EDGE = 8;
// Roughly the card's height: the room a side needs before the card goes there.
const CARD_ROOM = 230;
// Fixed bars at the bottom of the screen that the spotlight shouldn't cover.
const BARS = ['[data-tour="tabs"]', '[data-tour="review-meal"]'];
// Plain rgb, not bg-black: dark mode redefines black as a light gray.
const DIM = "rgb(0 0 0 / 0.6)";
// Show the card in the middle if the target hasn't appeared by then, but keep
// looking: a slow menu can still arrive later and the card moves to it.
const CENTER_AFTER_MS = 800;

// First match that's actually on the page. With cacheComponents, Next keeps
// pages you've left in the DOM with display: none, so a hidden copy of a
// target or bar can come first; it measures as 0×0 at the top of the screen.
function shown(selector: string) {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (el.getClientRects().length > 0) return el;
  }
  return null;
}

export function TourOverlay({
  step,
  index,
  total,
  onBack,
  onNext,
  onSkip,
}: {
  step: TourStep;
  index: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [waited, setWaited] = useState(!step.target);
  const card = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const last = index === total - 1;

  // Track the target every frame: it can load late, scroll, or move on resize.
  useEffect(() => {
    if (!step.target) return;
    const started = performance.now();
    let frame = 0;
    function measure() {
      const el = shown(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        // Stay above fixed bars (bottom nav, meal bar) unless they're the target.
        let floor = innerHeight - EDGE;
        for (const selector of BARS) {
          const bar = shown(selector);
          if (bar && bar !== el && !bar.contains(el)) {
            floor = Math.min(floor, bar.getBoundingClientRect().top - EDGE);
          }
        }
        // Not fully in view (above the bars)? Bring its top near the top of
        // the screen. Checked every frame, and instant rather than smooth:
        // after a page change Next resets the scroll and content streams in,
        // which would cancel a one-time smooth scroll partway.
        if (r.top < EDGE || (r.bottom > floor && r.top > GAP * 2 + 1)) {
          scrollTo({ top: scrollY + r.top - GAP * 2 });
        }
        // Clamp to the visible area between the top edge and the bars.
        const top = Math.max(r.top, EDGE);
        const bottom = Math.max(Math.min(r.bottom, floor), top);
        const next = { top, left: r.left, width: r.width, height: Math.max(bottom - top, 0), floor };
        setRect((prev) =>
          prev &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height &&
          prev.floor === next.floor
            ? prev
            : next,
        );
      } else if (performance.now() - started > CENTER_AFTER_MS) {
        setWaited(true);
      }
      frame = requestAnimationFrame(measure);
    }
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [step.target]);

  // Lock page scrolling while a step is open, so the highlight can't be
  // scrolled away from its target. The tour's own scrollTo still works.
  useEffect(() => {
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, []);

  // Keyboard: Esc skips, arrows step, Tab stays inside the card.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onSkip();
      else if (event.key === "ArrowRight") onNext();
      else if (event.key === "ArrowLeft" && index > 0) onBack();
      else if (event.key === "Tab" && card.current) {
        const buttons = [...card.current.querySelectorAll<HTMLElement>("button")];
        const first = buttons[0];
        const lastButton = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          lastButton.focus();
        } else if (!event.shiftKey && document.activeElement === lastButton) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [index, onBack, onNext, onSkip]);

  const visible = rect !== null || waited;

  useEffect(() => {
    if (visible) card.current?.focus();
  }, [visible]);

  if (!visible) {
    // Still looking for the target: block the page, but don't flash a card.
    return <div className="fixed inset-0 z-[60]" aria-hidden />;
  }

  // Card on whichever side of the target has room. On a short screen where
  // neither side fits, put it at the top, scrolling inside itself if needed.
  let cardStyle: React.CSSProperties;
  if (rect) {
    const spaceBelow = rect.floor - (rect.top + rect.height + PAD + GAP);
    const spaceAbove = rect.top - PAD - GAP - EDGE;
    if (spaceBelow >= CARD_ROOM && spaceBelow >= spaceAbove) {
      cardStyle = { top: rect.top + rect.height + PAD + GAP };
    } else if (spaceAbove >= CARD_ROOM) {
      cardStyle = { bottom: innerHeight - rect.top + PAD + GAP };
    } else {
      cardStyle = { top: EDGE, maxHeight: Math.max(rect.floor - EDGE, 120), overflowY: "auto" };
    }
  } else {
    cardStyle = { top: "50%", transform: "translateY(-50%)" };
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {rect ? (
        // The huge shadow dims everything outside the spotlight.
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl ring-2 ring-white/70"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: `0 0 0 9999px ${DIM}`,
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0" style={{ background: DIM }} />
      )}

      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="fixed inset-x-4 mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl outline-none dark:bg-gray-100"
        style={cardStyle}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {index + 1} of {total}
        </p>
        <h2 id={titleId} className="mt-1 text-lg font-bold">
          {step.title}
        </h2>
        <p id={bodyId} className="mt-1 text-sm text-gray-600">
          {step.body}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {!last && (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Skip tour
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

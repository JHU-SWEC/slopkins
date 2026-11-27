"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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
// The card's width (max-w-sm), for putting it beside a tall target such as
// the laptop sidebar.
const CARD_WIDTH = 384;
// Fixed bars at the bottom of the screen that the spotlight shouldn't cover.
const BARS = ['[data-tour="tabs"]', '[data-tour="review-meal"]'];
// Plain rgb, not bg-black: dark mode redefines black as a light gray.
const DIM = "rgb(0 0 0 / 0.6)";
// How often to look the target and bars up again in the page. Their positions
// are still read every frame (cheap), but searching the whole page is not:
// pages you've left stay in the DOM, so it grows as you move around.
const LOOKUP_MS = 250;
// If the target still hasn't shown up by then (a hall with no menu today),
// show the card in the middle and stop looking, so it can't jump later.
const GIVE_UP_MS = 4000;
// A short wait (prefetched page, target already there) shows no spinner at
// all; only a slow one gets "Loading…", so it doesn't flash.
const SPINNER_AFTER_MS = 300;

// First match that's actually on the page. With cacheComponents, Next keeps
// pages you've left in the DOM with display: none, so a hidden copy of a
// target or bar can come first; it measures as 0×0 at the top of the screen.
function shown(selector: string) {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (el.getClientRects().length > 0) return el;
  }
  return null;
}

// True if the element or a parent is position: fixed (the bottom nav, the
// bell). Scrolling can't move those, so trying would scroll the page away
// every frame. Sticky ones still move until they stick, so they don't count.
function pinned(el: HTMLElement) {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).position === "fixed") return true;
  }
  return false;
}

export function TourOverlay({
  step,
  index,
  total,
  onBack,
  onNext,
  onSkip,
  loading = false,
}: {
  step: TourStep;
  index: number;
  total: number;
  /** The step's page is still loading: don't look for the target yet. */
  loading?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [slow, setSlow] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const last = index === total - 1;

  // Track the target every frame: it can load late, scroll, or move on resize.
  // A layout effect, and the first measure runs right away rather than on
  // the next frame, so the card's first paint is already in its final spot.
  useLayoutEffect(() => {
    if (!step.target || loading) return;
    let frame = 0;
    let found = false;
    // Found elements are reused between lookups while they're still on screen.
    let el: HTMLElement | null = null;
    let bars: HTMLElement[] = [];
    let fixed = false;
    let lookedAt = -Infinity;
    const usable = (node: HTMLElement | null) => node !== null && node.isConnected && node.getClientRects().length > 0;
    function measure(now: number) {
      // Look again on a timer, or right away if the old one left the page
      // (e.g. a re-render replaced it).
      if (!usable(el) || now - lookedAt > LOOKUP_MS) {
        el = shown(`[data-tour="${step.target}"]`);
        bars = BARS.flatMap((selector) => shown(selector) ?? []);
        const wasFixed = fixed;
        fixed = el !== null && pinned(el);
        // A fixed target is always in view; start the page under it from the
        // top (e.g. the feed's first post) instead of wherever it was left.
        if (fixed && !wasFixed) scrollTo({ top: 0 });
        lookedAt = now;
      }
      if (el) {
        let r = el.getBoundingClientRect();
        // Stay above fixed bars (bottom nav, meal bar) unless they're the
        // target or sit above it (the meal bar rides above the bottom nav,
        // so it mustn't squash a highlighted tab).
        let floor = innerHeight - (fixed ? 0 : EDGE);
        for (const bar of bars) {
          if (bar.isConnected && bar !== el && !bar.contains(el)) {
            // On laptops the tabs are a sidebar, not a bottom bar: skip it.
            const top = bar.getBoundingClientRect().top;
            if (top > innerHeight / 2 && r.top < top) floor = Math.min(floor, top - EDGE);
          }
        }
        // Not fully in view (above the bars)? Bring its top near the top of
        // the screen. Checked every frame, and instant rather than smooth:
        // after a page change Next resets the scroll and content streams in,
        // which would cancel a one-time smooth scroll partway. Fixed targets
        // are skipped: scrolling never moves them.
        if (!fixed && (r.top < EDGE || (r.bottom > floor && r.top > GAP * 2 + 1))) {
          scrollTo({ top: scrollY + r.top - GAP * 2 });
          // Read it again after scrolling, or this frame would draw it where
          // it was before and the next frame would jump it into place.
          r = el.getBoundingClientRect();
        }
        // Clamp to the visible area between the top edge and the bars.
        const top = Math.max(r.top, EDGE);
        const bottom = Math.max(Math.min(r.bottom, floor), top);
        const next = { top, left: r.left, width: r.width, height: Math.max(bottom - top, 0), floor };
        found = true;
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
      }
      frame = requestAnimationFrame(measure);
    }
    measure(performance.now());
    const giveUp = setTimeout(() => {
      if (found) return;
      cancelAnimationFrame(frame);
      setGaveUp(true);
    }, GIVE_UP_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(giveUp);
    };
  }, [step.target, loading]);

  // The card shows once it knows where it goes: on the step's page, and next
  // to its target (or in the middle if there's no target or it never came).
  const ready = !loading && (!step.target || rect !== null || gaveUp);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setSlow(true), SPINNER_AFTER_MS);
    return () => clearTimeout(timer);
  }, [ready]);

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
      else if (event.key === "ArrowRight" && ready) onNext();
      else if (event.key === "ArrowLeft" && ready && index > 0) onBack();
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
  }, [index, ready, onBack, onNext, onSkip]);

  useEffect(() => {
    if (ready) card.current?.focus();
  }, [ready]);

  if (!ready) {
    // Still on the last page or waiting for the target: dim and block the
    // page, but hold the card back so it never shows up in the wrong spot.
    return (
      <div className="fixed inset-0 z-[60]" style={{ background: DIM }}>
        {slow && (
          <div className="fixed inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
            <span role="status" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow dark:bg-gray-100">
              Loading…
            </span>
            <button type="button" onClick={onSkip} className="text-sm font-medium text-white/80 hover:text-white">
              Skip tour
            </button>
          </div>
        )}
      </div>
    );
  }

  // Card below or above the target, whichever has room; failing that, to its
  // right (the laptop sidebar runs the full height, so only beside it works).
  // On a short screen where nothing fits, put it at the top, scrolling inside
  // itself if needed.
  const target = rect;
  let cardStyle: React.CSSProperties;
  if (target) {
    const spaceBelow = target.floor - (target.top + target.height + PAD + GAP);
    const spaceAbove = target.top - PAD - GAP - EDGE;
    if (spaceBelow >= CARD_ROOM && spaceBelow >= spaceAbove) {
      cardStyle = { top: target.top + target.height + PAD + GAP };
    } else if (spaceAbove >= CARD_ROOM) {
      cardStyle = { bottom: innerHeight - target.top + PAD + GAP };
    } else if (innerWidth - (target.left + target.width + PAD + GAP) >= CARD_WIDTH + EDGE) {
      // Level with the middle of the target, kept on screen.
      const middle = target.top + target.height / 2;
      cardStyle = {
        left: target.left + target.width + PAD + GAP,
        right: "auto",
        marginInline: 0,
        width: CARD_WIDTH,
        top: Math.min(Math.max(middle, EDGE + CARD_ROOM / 2), target.floor - CARD_ROOM / 2),
        transform: "translateY(-50%)",
      };
    } else {
      cardStyle = { top: EDGE, maxHeight: Math.max(target.floor - EDGE, 120), overflowY: "auto" };
    }
  } else {
    cardStyle = { top: "50%", transform: "translateY(-50%)" };
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {target ? (
        // The huge shadow dims everything outside the spotlight.
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl ring-2 ring-white/70"
          style={{
            top: target.top - PAD,
            left: target.left - PAD,
            width: target.width + PAD * 2,
            height: target.height + PAD * 2,
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
          <div className="ml-auto flex items-center gap-2">
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
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand/90"
            >
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

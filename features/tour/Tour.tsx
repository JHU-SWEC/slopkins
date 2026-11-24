"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { tourSteps } from "./steps";
import { TourOverlay } from "./TourOverlay";

// Progress lives in localStorage under "tour": "done", or the step number so a
// refresh picks up where you left off. Missing means never seen.
const KEY = "tour";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return "done"; // Storage blocked: don't nag on every page.
  }
}

function write(value: string) {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Restarts the tour from the first step, from any page. */
export function startTour() {
  write("0");
}

// Renders the tour overlay when a step is active. usePathname can suspend, so
// render this inside <Suspense> next to the page, not around it.
export function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  // The server can't see localStorage, so it renders as if the tour is done.
  const saved = useSyncExternalStore(subscribe, read, () => "done");

  // Signed-in people end the tour on their profile; others can't open it yet.
  // The session is read from browser storage, so this doesn't hit the network.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    // Inside the chain so a missing Supabase config also lands in catch.
    Promise.resolve()
      .then(() => createClient().auth.getSession())
      .then(({ data }) => setSignedIn(data.session !== null))
      .catch(() => setSignedIn(false));
  }, []);
  const steps = tourSteps(signedIn === true);

  // First visit starts on the feed, where sign-in lands; other pages don't
  // get pulled into the tour. A saved step resumes anywhere.
  const index =
    saved === "done" ? null : saved === null ? (pathname === "/feed" ? 0 : null) : Number(saved);
  const step =
    signedIn !== null && index !== null && index >= 0 && index < steps.length ? steps[index] : null;
  const route = step?.route;
  const onRoute = !route || route === pathname;

  useEffect(() => {
    if (route && !onRoute) router.push(route);
  }, [route, onRoute, router]);

  function go(next: number) {
    write(next >= steps.length ? "done" : String(next));
  }

  if (!step || index === null || !onRoute) return null;
  return (
    <TourOverlay
      // Remount per step so the target search and focus start fresh.
      key={index}
      step={step}
      index={index}
      total={steps.length}
      onBack={() => go(index - 1)}
      onNext={() => go(index + 1)}
      onSkip={() => write("done")}
    />
  );
}

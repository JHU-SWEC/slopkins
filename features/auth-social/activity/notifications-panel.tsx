"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityList } from "./activity-list";
import type { ActivityItem } from "./queries";

type Loaded =
  | { signedIn: false }
  | { signedIn: true; items: ActivityItem[]; now: number; lastSeen: string | null };

/**
 * Laptops: notifications slide out from the left edge in place of the
 * sidebar, over the page you're on, like Instagram on the web. Phones don't use this; their bell opens the
 * full /activity page. Loads fresh each time it opens.
 */
export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/activity/panel", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Loaded>) : Promise.reject()))
      .then((loaded) => !cancelled && setData(loaded))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Esc closes it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Clicking anywhere outside the panel closes it. */}
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-30 hidden md:block" />
      <aside
        aria-label="Notifications"
        // Following a link closes the panel (even one to the page you're on).
        onClick={(event) => (event.target as HTMLElement).closest("a") && onClose()}
        className="fixed inset-y-0 left-0 z-30 hidden w-[400px] flex-col rounded-r-2xl border-r border-gray-200 bg-white text-heritage-blue shadow-xl md:flex dark:text-white"
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-7">
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="-mr-2 rounded-full px-2 text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {failed ? (
            <Empty>Couldn&apos;t load notifications. Try again in a bit.</Empty>
          ) : !data ? (
            <Skeleton />
          ) : !data.signedIn ? (
            <Empty>
              <Link href="/login" className="font-semibold underline">
                Log in
              </Link>{" "}
              to see who followed you and who liked, commented on or bookmarked your posts.
            </Empty>
          ) : data.items.length === 0 ? (
            <Empty>Nothing here yet. When people follow you, or like, comment on or bookmark your posts, it&apos;ll show up here.</Empty>
          ) : (
            <ActivityList items={data.items} lastSeen={data.lastSeen} now={data.now} />
          )}
        </div>
      </aside>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/60">
      {children}
    </p>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading notifications">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-gray-100 dark:bg-white/10" />
          <div className="h-4 flex-1 rounded bg-gray-100 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type MenuDay = {
  date: string; // YYYY-MM-DD
  href: string;
  top: string; // "Today" or a weekday, e.g. "Fri"
  number: string; // day of the month, e.g. "27"
};

// The day row above a hall's menu, plus the menu itself (children). Picking a
// day runs the navigation in a transition, so until the new menu arrives the
// picked day pulses and the menu says it's loading, instead of the old one
// sitting there as if the tap did nothing.
export function DaySwitcher({
  days,
  date,
  children,
}: {
  days: MenuDay[];
  date: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [picked, setPicked] = useState<MenuDay | null>(null);
  const loading = isPending && picked !== null && picked.date !== date ? picked : null;

  return (
    <>
      <nav aria-label="Day" className="-mx-4 mt-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {days.map((day) => {
            const active = loading ? day.date === loading.date : day.date === date;
            return (
              <li key={day.date}>
                <Link
                  href={day.href}
                  scroll={false}
                  aria-current={day.date === date ? "date" : undefined}
                  // Only for in-app navigation: a cmd/ctrl-click still opens a new tab.
                  onNavigate={(event) => {
                    if (day.date === date) return;
                    event.preventDefault();
                    setPicked(day);
                    startTransition(() => router.push(day.href, { scroll: false }));
                  }}
                  className={`flex w-14 flex-col items-center rounded-xl py-1.5 text-center transition ${
                    loading && active
                      ? "animate-pulse bg-gray-200 text-gray-700"
                      : active
                        ? "bg-brand text-on-brand"
                        : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xs font-medium">{day.top}</span>
                  <span className="text-lg font-semibold leading-tight">{day.number}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {loading && (
        <p role="status" className="mt-6 animate-pulse text-gray-500">
          Loading {loading.top === "Today" ? "today's" : `${loading.top}'s`} menu…
        </p>
      )}
      {/* Hidden, not removed, so a half-picked meal survives if the load is cut short. */}
      <div hidden={loading !== null}>{children}</div>
    </>
  );
}

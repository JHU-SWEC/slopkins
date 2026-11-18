"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserId, logMeal } from "@/features/ranking/store";
import type { HallSlug } from "@/lib/halls";
import type { MockDish, MockMenuTab } from "@/lib/mock-data";

export function MenuPicker({ hallSlug, tabs }: { hallSlug: HallSlug; tabs: MockMenuTab[] }) {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // A meal post has one meal, so switching meals clears the selection.
  // Levering kitchens have no meal, so selections carry across tabs.
  const keepSelection = tabs.every((tab) => tab.meal === null);
  const tab = tabs[tabIndex];

  function switchTab(index: number) {
    setTabIndex(index);
    if (!keepSelection) setSelected(new Set());
  }

  function toggle(dishId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dishId)) next.delete(dishId);
      else next.add(dishId);
      return next;
    });
  }

  // Log first, then rank. "Log only" skips the rank step entirely; dishes
  // stay skippable one by one on the rank page either way.
  const allDishes = tabs.flatMap((t) => t.dishes);
  const rankableCount = allDishes.filter((d) => selected.has(d.id) && d.rankable).length;

  function log(rank: boolean) {
    const mealId = logMeal({
      userId: getCurrentUserId(),
      hallSlug,
      meal: tab.meal,
      dishIds: [...selected],
      rank,
    });
    router.push(rank ? `/rank?meal=${mealId}` : "/feed");
  }

  // Group the tab's dishes by station, keeping menu order.
  const stations = new Map<string, MockDish[]>();
  for (const dish of tab.dishes) {
    stations.set(dish.station, [...(stations.get(dish.station) ?? []), dish]);
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t, index) => (
          <button
            key={t.label}
            type="button"
            onClick={() => switchTab(index)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              index === tabIndex
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6 pb-20">
        {[...stations].map(([station, dishes]) => (
          <section key={station}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              {station}
            </h2>
            <ul className="mt-2 divide-y divide-gray-100 rounded-2xl border border-gray-200">
              {dishes.map((dish) => (
                <li key={dish.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selected.has(dish.id)}
                      onChange={() => toggle(dish.id)}
                      className="h-5 w-5 accent-blue-600"
                    />
                    <span className="flex-1 font-medium">{dish.name}</span>
                    {!dish.rankable && (
                      <span className="text-xs text-gray-400">Not ranked</span>
                    )}
                    {dish.calories !== null && (
                      <span className="text-sm text-gray-400">{dish.calories} cal</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Saved to localStorage until auth and log_meal() are wired up. */}
      <div className="fixed inset-x-0 bottom-16 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          {rankableCount > 0 && (
            <button
              type="button"
              onClick={() => log(false)}
              className="shrink-0 rounded-md border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Log only
            </button>
          )}
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => log(rankableCount > 0)}
            className="flex-1 rounded-md bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            {rankableCount > 0 ? `Log & rank (${selected.size})` : `Log meal (${selected.size})`}
          </button>
        </div>
      </div>
    </>
  );
}

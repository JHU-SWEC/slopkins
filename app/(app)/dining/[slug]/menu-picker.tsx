"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MockDish, MockMenuTab } from "@/lib/mock-data";

export function MenuPicker({ tabs }: { tabs: MockMenuTab[] }) {
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

  // Group the tab's dishes by station, keeping menu order.
  const stations = new Map<string, MockDish[]>();
  for (const dish of tab.dishes) {
    stations.set(dish.station, [...(stations.get(dish.station) ?? []), dish]);
  }

  return (
    <>
      <div className="mt-6 flex gap-2 overflow-x-auto">
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

      {/* Mockup: nothing is saved. Real version logs the meal. */}
      <div className="fixed inset-x-0 bottom-16 border-t border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => router.push("/feed")}
          className="mx-auto block w-full max-w-2xl rounded-md bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          Log meal ({selected.size})
        </button>
      </div>
    </>
  );
}

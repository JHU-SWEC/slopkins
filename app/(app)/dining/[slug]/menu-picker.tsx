"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuDish, MenuTab, Nutrition } from "@/lib/menus";
import { mealTotals, nutritionFor, type Basis } from "@/lib/nutrition";
import { BasisToggle } from "./basis-toggle";
import { MealCart, servingsOf, type CartItem } from "./meal-cart";
import { NutritionFacts } from "./nutrition-facts";

type SortKey = "menu" | "calories" | "protein" | "carbs" | "fat" | "sugar" | "fiber" | "sodium";
type SortDirection = "asc" | "desc";

const SORTS: {
  key: SortKey;
  label: string;
  unit: string;
  // Direction picked when you choose this sort, e.g. most protein first.
  defaultDirection: SortDirection;
}[] = [
  { key: "menu", label: "Menu order", unit: "", defaultDirection: "asc" },
  { key: "calories", label: "Calories", unit: " cal", defaultDirection: "asc" },
  { key: "protein", label: "Protein", unit: "g protein", defaultDirection: "desc" },
  { key: "carbs", label: "Carbs", unit: "g carbs", defaultDirection: "asc" },
  { key: "fat", label: "Fat", unit: "g fat", defaultDirection: "asc" },
  { key: "sugar", label: "Sugar", unit: "g sugar", defaultDirection: "asc" },
  { key: "fiber", label: "Fiber", unit: "g fiber", defaultDirection: "desc" },
  { key: "sodium", label: "Sodium", unit: "mg sodium", defaultDirection: "asc" },
];

type Section = {
  title: string;
  dishes: MenuDish[];
  showStation: boolean; // true when the list mixes stations
  highlight?: boolean;
};

// canLog is false for future days: you can plan a meal but not log it yet.
export function MenuPicker({ tabs, canLog }: { tabs: MenuTab[]; canLog: boolean }) {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  // Selected dishes and how much of each, in the order they were picked.
  const [cart, setCart] = useState<Map<number, CartItem>>(new Map());
  const [cartOpen, setCartOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("menu");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [basis, setBasis] = useState<Basis>("serving");
  const [detailDish, setDetailDish] = useState<MenuDish | null>(null);
  const [query, setQuery] = useState("");

  // A meal post has one meal, so switching meals clears the selection.
  // Levering kitchens have no meal, so selections carry across tabs.
  const keepSelection = tabs.every((tab) => tab.meal === null);
  const tab = tabs[tabIndex];
  const sort = SORTS.find((s) => s.key === sortKey)!;

  function switchTab(index: number) {
    setTabIndex(index);
    if (!keepSelection) setCart(new Map());
  }

  function changeSort(key: SortKey) {
    setSortKey(key);
    setDirection(SORTS.find((s) => s.key === key)!.defaultDirection);
  }

  function toggle(dish: MenuDish) {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(dish.id)) next.delete(dish.id);
      else next.set(dish.id, { dish, amount: "1", unit: "serving" });
      return next;
    });
  }

  function updateItem(item: CartItem) {
    setCart((prev) => new Map(prev).set(item.dish.id, item));
  }

  function removeItem(dishId: number) {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(dishId);
      return next;
    });
  }

  const cartItems = [...cart.values()];
  const cartCalories = cartItems.length
    ? mealTotals(cartItems.map((item) => ({ dish: item.dish, servings: servingsOf(item) }))).nutrition.calories
    : null;

  // Search matches dish or station names, case-insensitively.
  const search = query.trim().toLowerCase();
  const matching = search
    ? tab.dishes.filter(
        (dish) => dish.name.toLowerCase().includes(search) || dish.station.toLowerCase().includes(search),
      )
    : tab.dishes;

  // Some dishes are served at several stations; list each one once outside stations.
  const unique = [...new Map(matching.map((dish) => [dish.id, dish])).values()];
  if (sortKey !== "menu") {
    // Ranked by the chosen nutrient, dishes missing that value last.
    const key = sortKey as keyof Nutrition;
    const sign = direction === "asc" ? 1 : -1;
    unique.sort((a, b) => {
      const x = nutritionFor(a, basis)[key];
      const y = nutritionFor(b, basis)[key];
      if (x === null || y === null) return (x === null ? 1 : 0) - (y === null ? 1 : 0);
      return (x - y) * sign;
    });
  }

  // Mains first (in the current order), then the full menu: by station in
  // menu order, or one ranked list otherwise.
  const sections: Section[] = [];
  const mains = unique.filter((dish) => dish.isMain);
  if (mains.length) sections.push({ title: "Mains", dishes: mains, showStation: true, highlight: true });
  if (sortKey === "menu") {
    const stations = new Map<string, MenuDish[]>();
    for (const dish of matching) {
      stations.set(dish.station, [...(stations.get(dish.station) ?? []), dish]);
    }
    for (const [station, dishes] of stations) sections.push({ title: station, dishes, showStation: false });
  } else if (unique.length) {
    sections.push({ title: "Everything", dishes: unique, showStation: true });
  }

  function sortValue(dish: MenuDish) {
    const nutrition = nutritionFor(dish, basis);
    if (sortKey === "menu") return nutrition.calories !== null ? `${nutrition.calories} cal` : null;
    const value = nutrition[sortKey as keyof Nutrition];
    return value !== null ? `${value}${sort.unit}` : "—";
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

      {tab.dishes.length > 0 && (
        <div className="relative mt-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${tab.label.toLowerCase()}`}
            aria-label="Search dishes"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm placeholder:text-gray-400 focus:border-blue-600 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      )}

      {tab.dishes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-500">
            Sort by
          </label>
          <select
            id="sort"
            value={sortKey}
            onChange={(event) => changeSort(event.target.value as SortKey)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          {sortKey !== "menu" && (
            <button
              type="button"
              onClick={() => setDirection(direction === "asc" ? "desc" : "asc")}
              className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              {direction === "asc" ? "↑ Low to high" : "↓ High to low"}
            </button>
          )}
          <BasisToggle basis={basis} onChange={setBasis} />
        </div>
      )}

      <div className="mt-6 space-y-6 pb-20">
        {tab.dishes.length === 0 && (
          <p className="text-gray-500">Nothing posted for {tab.label.toLowerCase()} {canLog ? "today" : "yet"}.</p>
        )}
        {tab.dishes.length > 0 && sections.length === 0 && (
          <p className="text-gray-500">No dishes match &ldquo;{query.trim()}&rdquo;.</p>
        )}
        {sections.map(({ title, dishes, showStation, highlight }) => (
          <section key={highlight ? "mains" : `station:${title}`}>
            <h2
              className={`text-sm font-semibold uppercase tracking-wide ${
                highlight ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {title}
            </h2>
            <ul className="mt-2 divide-y divide-gray-100 rounded-2xl border border-gray-200">
              {dishes.map((dish) => (
                <li key={`${dish.station}:${dish.id}`} className="flex items-center hover:bg-gray-50">
                  <label className="flex flex-1 cursor-pointer items-center gap-3 py-3 pl-4">
                    <input
                      type="checkbox"
                      checked={cart.has(dish.id)}
                      onChange={() => toggle(dish)}
                      className="h-5 w-5 accent-blue-600"
                    />
                    <span className="flex-1">
                      <span className="block font-medium">{dish.name}</span>
                      {/* Mixed-station lists show where to find each dish. */}
                      {showStation && <span className="block text-xs text-gray-400">{dish.station}</span>}
                    </span>
                    {sortValue(dish) && (
                      <span className="text-sm text-gray-400">{sortValue(dish)}</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setDetailDish(dish)}
                    aria-label={`Nutrition facts for ${dish.name}`}
                    className="mx-2 rounded-full px-2.5 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Nutrition
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <NutritionFacts
        dish={detailDish}
        basis={basis}
        onBasisChange={setBasis}
        onClose={() => setDetailDish(null)}
      />

      <MealCart
        items={cartItems}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onChange={updateItem}
        onRemove={removeItem}
        canLog={canLog}
        // Mockup: nothing is saved. Real version logs the meal.
        onLog={() => router.push("/feed")}
      />

      <div className="fixed inset-x-0 bottom-16 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className="flex-1 text-sm text-gray-500">
            {cartItems.length === 0 ? (
              "Check off what you ate"
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                </span>
                {cartCalories !== null && ` · ${cartCalories} cal`}
              </>
            )}
          </p>
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={() => setCartOpen(true)}
            className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            Review meal
          </button>
        </div>
      </div>
    </>
  );
}


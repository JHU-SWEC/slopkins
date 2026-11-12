"use client";

import { useEffect, useRef } from "react";
import type { MenuDish } from "@/lib/menus";
import { mealTotals, nutritionForServings } from "@/lib/nutrition";
import { NutritionLabel } from "./nutrition-facts";

export type AmountUnit = "serving" | "g";

// A dish in the meal, with how much you ate as typed (kept as text so
// half-typed numbers like "1." don't get rewritten).
export type CartItem = {
  dish: MenuDish;
  amount: string;
  unit: AmountUnit;
};

const STEP: Record<AmountUnit, number> = { serving: 0.5, g: 25 };

/** How many servings the item's amount is. Bad or empty input counts as 0. */
export function servingsOf({ dish, amount, unit }: CartItem) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (unit === "g") return dish.servingGrams ? value / dish.servingGrams : 0;
  return value;
}

function format(value: number) {
  return String(Math.round(value * 100) / 100);
}

/** The item with its amount switched to the other unit, same quantity. */
function convert(item: CartItem, unit: AmountUnit): CartItem {
  const servings = servingsOf(item);
  const grams = item.dish.servingGrams ?? 0;
  const amount = unit === "g" ? String(Math.round(servings * grams)) : format(servings);
  return { ...item, unit, amount };
}

// Modal to adjust portions and see the whole meal's nutrition.
export function MealCart({
  items,
  open,
  onClose,
  onChange,
  onRemove,
  onLog,
  canLog,
}: {
  items: CartItem[];
  open: boolean;
  onClose: () => void;
  onChange: (item: CartItem) => void;
  onRemove: (dishId: number) => void;
  onLog: () => void;
  canLog: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const totals =
    items.length > 0 ? mealTotals(items.map((item) => ({ dish: item.dish, servings: servingsOf(item) }))) : null;

  function step(item: CartItem, direction: 1 | -1) {
    const current = Number(item.amount) || 0;
    const next = Math.max(0, current + STEP[item.unit] * direction);
    onChange({ ...item, amount: format(next) });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-gray-900 backdrop:bg-black/40"
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold">{canLog ? "Your meal" : "Meal plan"}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 rounded-full px-2 text-2xl leading-none text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing selected yet. Check off what you ate.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
                {items.map((item) => (
                  <CartRow
                    key={item.dish.id}
                    item={item}
                    onChange={onChange}
                    onStep={(direction) => step(item, direction)}
                    onRemove={() => onRemove(item.dish.id)}
                  />
                ))}
              </ul>
            )}

            {totals && (
              <>
                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  {(
                    [
                      ["calories", "Calories", ""],
                      ["protein", "Protein", "g"],
                      ["carbs", "Carbs", "g"],
                      ["fat", "Fat", "g"],
                    ] as const
                  ).map(([key, label, unit]) => (
                    <div key={key} className="rounded-xl bg-gray-50 px-1 py-2.5">
                      <p className="text-lg font-bold tabular-nums">
                        {totals.nutrition[key] === null ? "—" : `${totals.nutrition[key]}${unit}`}
                        {totals.incomplete.has(key) && "†"}
                      </p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                <NutritionLabel
                  className="mt-5"
                  nutrition={totals.nutrition}
                  sizeLabel="Meal"
                  size={`${items.length} ${items.length === 1 ? "item" : "items"}`}
                  amountLabel="Total for this meal"
                  incomplete={totals.incomplete}
                />
              </>
            )}
          </div>

          {/* Mockup: nothing is saved. Real version logs the meal. */}
          <div className="border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              disabled={items.length === 0 || !canLog}
              onClick={onLog}
              className="block w-full rounded-md bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
            >
              Log meal
            </button>
            {!canLog && (
              <p className="mt-2 text-center text-xs text-gray-500">
                This menu is for a future day. You can log meals on the day you eat them.
              </p>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

function CartRow({
  item,
  onChange,
  onStep,
  onRemove,
}: {
  item: CartItem;
  onChange: (item: CartItem) => void;
  onStep: (direction: 1 | -1) => void;
  onRemove: () => void;
}) {
  const { dish } = item;
  const calories = nutritionForServings(dish, servingsOf(item)).calories;
  const canUseGrams = Boolean(dish.servingGrams);

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{dish.name}</p>
          <p className="text-xs text-gray-400">
            {dish.station}
            {dish.servingSize && (
              <>
                {" · "}1 serving = {dish.servingSize}
                {dish.servingGrams && !dish.servingSize.endsWith(" g")
                  ? ` (${Math.round(dish.servingGrams)} g)`
                  : ""}
              </>
            )}
          </p>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-gray-500">
          {calories === null ? "— cal" : `${calories} cal`}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center rounded-md border border-gray-200">
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label={`Less ${dish.name}`}
            className="px-2.5 py-1 text-gray-500 hover:text-gray-900"
          >
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={item.amount}
            onChange={(event) => onChange({ ...item, amount: event.target.value })}
            aria-label={`Amount of ${dish.name}`}
            className="w-14 bg-transparent py-1 text-center text-sm tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label={`More ${dish.name}`}
            className="px-2.5 py-1 text-gray-500 hover:text-gray-900"
          >
            +
          </button>
        </div>

        {canUseGrams ? (
          <select
            value={item.unit}
            onChange={(event) => onChange(convert(item, event.target.value as AmountUnit))}
            aria-label={`Unit for ${dish.name}`}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm"
          >
            <option value="serving">{Number(item.amount) === 1 ? "serving" : "servings"}</option>
            <option value="g">grams</option>
          </select>
        ) : (
          <span className="text-sm text-gray-500">{Number(item.amount) === 1 ? "serving" : "servings"}</span>
        )}

        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          Remove
        </button>
      </div>
    </li>
  );
}

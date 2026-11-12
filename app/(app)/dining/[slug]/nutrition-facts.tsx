"use client";

import { useEffect, useRef } from "react";
import type { MenuDish, Nutrition } from "@/lib/menus";
import { nutritionFor, type Basis } from "@/lib/nutrition";
import { BasisToggle } from "./basis-toggle";

// FDA Daily Values for a 2,000 calorie diet, used for the % column.
const DAILY_VALUES: Partial<Record<keyof Nutrition, number>> = {
  fat: 78,
  saturatedFat: 20,
  cholesterol: 300,
  sodium: 2300,
  carbs: 275,
  fiber: 28,
  addedSugar: 50,
  protein: 50,
  vitaminD: 20,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
};

type Row = {
  key: keyof Nutrition;
  label: string;
  unit: string;
  indent?: boolean;
  bold?: boolean;
};

const MACRO_ROWS: Row[] = [
  { key: "fat", label: "Total Fat", unit: "g", bold: true },
  { key: "saturatedFat", label: "Saturated Fat", unit: "g", indent: true },
  { key: "transFat", label: "Trans Fat", unit: "g", indent: true },
  { key: "cholesterol", label: "Cholesterol", unit: "mg", bold: true },
  { key: "sodium", label: "Sodium", unit: "mg", bold: true },
  { key: "carbs", label: "Total Carbohydrate", unit: "g", bold: true },
  { key: "fiber", label: "Dietary Fiber", unit: "g", indent: true },
  { key: "sugar", label: "Total Sugars", unit: "g", indent: true },
  { key: "addedSugar", label: "Includes Added Sugars", unit: "g", indent: true },
  { key: "protein", label: "Protein", unit: "g", bold: true },
];

const MINERAL_ROWS: Row[] = [
  { key: "vitaminD", label: "Vitamin D", unit: "mcg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
];

// Modal with a dish's full nutrition label. Pass null to close it.
export function NutritionFacts({
  dish,
  basis,
  onBasisChange,
  onClose,
}: {
  dish: MenuDish | null;
  basis: Basis;
  onBasisChange: (basis: Basis) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dish && !dialog.open) dialog.showModal();
    if (!dish && dialog.open) dialog.close();
  }, [dish]);

  const hasNutrition = dish && Object.values(dish.nutrition).some((value) => value !== null);
  // Per 100 g needs the serving weight; fall back to per serving without it.
  const canScale = Boolean(dish?.servingGrams);
  const shownBasis = canScale ? basis : "serving";
  const n = dish && nutritionFor(dish, shownBasis);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Clicking the dimmed backdrop (the dialog element itself) closes it.
      onClick={(event) => event.target === dialogRef.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl p-0 backdrop:bg-black/40"
    >
      {dish && (
        <div className="max-h-[85vh] overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold leading-tight">{dish.name}</h2>
              <p className="mt-0.5 text-sm text-gray-500">{dish.station}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 rounded-full px-2 text-2xl leading-none text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {dish.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {dish.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {hasNutrition && canScale && (
            <BasisToggle basis={basis} onChange={onBasisChange} className="mt-4 w-fit" />
          )}

          {hasNutrition && n ? (
            <section
              aria-label="Nutrition Facts"
              className="mt-4 border-2 border-black px-2 pb-2 pt-1 text-sm text-black"
            >
              <h3 className="text-3xl font-black leading-none tracking-tight">Nutrition Facts</h3>
              <div className="mt-1 flex justify-between border-b-8 border-black pb-1 font-bold">
                <span>{shownBasis === "100g" ? "Amount" : "Serving size"}</span>
                <span>
                  {shownBasis === "100g"
                    ? `100 g (serving is ${dish.servingSize})`
                    : (dish.servingSize ?? "1 serving")}
                </span>
              </div>

              <p className="mt-1 text-xs font-bold">
                {shownBasis === "100g" ? "Amount per 100 g" : "Amount per serving"}
              </p>
              <div className="flex items-end justify-between border-b-4 border-black pb-1">
                <span className="text-2xl font-black">Calories</span>
                <span className="text-3xl font-black">{n.calories ?? "—"}</span>
              </div>

              <p className="border-b border-black py-0.5 text-right text-xs font-bold">% Daily Value*</p>
              {MACRO_ROWS.map((row) => (
                <FactRow key={row.key} row={row} value={n[row.key]} />
              ))}
              <div className="border-b-8 border-black" />
              {MINERAL_ROWS.map((row) => (
                <FactRow key={row.key} row={row} value={n[row.key]} />
              ))}

              <p className="mt-1 border-t-4 border-black pt-1 text-[11px] leading-snug">
                * The % Daily Value tells you how much a nutrient in a serving of food contributes to a
                daily diet. 2,000 calories a day is used for general nutrition advice.
              </p>
            </section>
          ) : (
            <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
              The dining hall hasn&apos;t posted nutrition info for this item.
            </p>
          )}

          {dish.ingredients && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Ingredients</h3>
              <p className="mt-1 text-sm text-gray-600">{dish.ingredients}</p>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

function FactRow({ row, value }: { row: Row; value: number | null }) {
  const daily = DAILY_VALUES[row.key];
  const percent = value !== null && daily ? Math.round((value / daily) * 100) : null;
  return (
    <div className={`flex justify-between border-b border-gray-400 py-0.5 ${row.indent ? "pl-4" : ""}`}>
      <span>
        <span className={row.bold ? "font-bold" : ""}>{row.label}</span>{" "}
        {value === null ? "—" : `${value}${row.unit}`}
      </span>
      {percent !== null && <span className="font-bold">{percent}%</span>}
    </div>
  );
}

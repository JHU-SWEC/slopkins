"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { rankPlateAction, rerankPlateAction, type ActionResult } from "../actions";
import { mealTitle } from "../format";
import type { MealWithDishes, RankedPlate } from "../types";
import { DishNames, RankPlate } from "./RankPlate";
import { primaryButton, secondaryButton } from "./styles";
import { Score, TextButton } from "./ui";

/**
 * Ranking for one logged meal: the plate as a whole, then a summary.
 * `meal` and `list` come from the server; each action re-renders the page with fresh data.
 */
export default function RankMeal({ meal, list }: { meal: MealWithDishes; list: RankedPlate[] }) {
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startSaving(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  // The plate waits in the queue while any of its dishes is pending.
  const waiting = meal.dishes.some((row) => row.rank_status === "pending");
  const errorLine = error && (
    <p role="alert" className="mt-4 text-sm text-red-600">
      {error}
    </p>
  );

  if (!waiting) {
    return (
      <>
        <Summary meal={meal} list={list} onRank={() => run(() => rerankPlateAction(meal.id))} />
        {errorLine}
      </>
    );
  }

  return (
    // Ignore taps while a save is on its way, so a plate isn't saved twice.
    <div aria-busy={saving} className={saving ? "pointer-events-none opacity-60" : undefined}>
      <RankPlate
        key={meal.id}
        meal={meal}
        list={list}
        onRank={(result) => run(() => rankPlateAction({ ...result, mealId: meal.id }))}
      />
      {errorLine}
    </div>
  );
}

function Summary({ meal, list, onRank }: { meal: MealWithDishes; list: RankedPlate[]; onRank: () => void }) {
  const ranking = list.find((item) => item.meal_id === meal.id);

  return (
    <div className="mt-6">
      <p className="text-sm text-gray-500">{mealTitle(meal)}</p>
      <h2 className="mt-1 text-xl font-semibold">{ranking ? "Plate ranked" : "Meal logged"}</h2>
      <DishNames names={meal.dishes.map((row) => row.dish.name)} />

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3">
        {ranking ? (
          <>
            <span className="text-gray-700">
              #{ranking.rank} on your list · <Score score={ranking.score} />
            </span>
            <TextButton onClick={onRank}>Re-rank</TextButton>
          </>
        ) : (
          <>
            <span className="text-gray-500">Not ranked</span>
            <button
              type="button"
              onClick={onRank}
              className="text-sm font-semibold text-brand hover:text-brand/80"
            >
              Rank it
            </button>
          </>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <Link href="/profile#ranked" className={primaryButton}>
          View my ranked plates
        </Link>
        <Link href="/feed" className={secondaryButton}>
          Done
        </Link>
      </div>
    </div>
  );
}

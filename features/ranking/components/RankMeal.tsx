"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { rankDishAction, setRankStatusAction, skipRestAction, type ActionResult } from "../actions";
import type { MealWithDishes, RankedDish, RankStatus } from "../types";
import { mealTitle } from "../format";
import { RankDish } from "./RankDish";
import { listBox, primaryButton, secondaryButton } from "./styles";
import { Score, TextButton } from "./ui";

/**
 * The rank queue for one logged meal: each rankable dish in turn, then a summary.
 * `meal` and `list` come from the server; each action re-renders the page with fresh data.
 */
export default function RankMeal({ meal, list }: { meal: MealWithDishes; list: RankedDish[] }) {
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startSaving(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }
  function setStatus(dishId: number, status: RankStatus) {
    run(() => setRankStatusAction(meal.id, dishId, status));
  }

  const rankable = meal.dishes.filter((row) => row.rank_status !== "unrankable");
  const pending = rankable.filter((row) => row.rank_status === "pending");
  const current = pending[0];
  const errorLine = error && (
    <p role="alert" className="mt-4 text-sm text-rose-600">
      {error}
    </p>
  );

  if (!current) {
    return (
      <>
        <Summary meal={meal} list={list} onRankAgain={(id) => setStatus(id, "pending")} />
        {errorLine}
      </>
    );
  }

  const done = rankable.length - pending.length;

  return (
    // Ignore taps while a save is on its way, so a dish isn't saved twice.
    <div aria-busy={saving} className={saving ? "pointer-events-none opacity-60" : undefined}>
      <RankDish
        key={current.dish_id}
        dish={current.dish}
        list={list}
        progress={`${mealTitle(meal)} · ${done + 1} of ${rankable.length}`}
        onRank={(result) => run(() => rankDishAction({ ...result, mealId: meal.id }))}
        onKeep={() => setStatus(current.dish_id, "ranked")}
        onSkip={() => setStatus(current.dish_id, "skipped")}
      />
      {errorLine}
      {pending.length > 1 && (
        <div className="mt-8 border-t border-gray-100 pt-4 text-center">
          <TextButton onClick={() => run(() => skipRestAction(meal.id))}>
            Skip the rest ({pending.length})
          </TextButton>
        </div>
      )}
    </div>
  );
}

function Summary({
  meal,
  list,
  onRankAgain,
}: {
  meal: MealWithDishes;
  list: RankedDish[];
  onRankAgain: (dishId: number) => void;
}) {
  return (
    <div className="mt-6">
      <p className="text-sm text-gray-500">{mealTitle(meal)}</p>
      <h2 className="mt-1 text-xl font-semibold">Meal logged</h2>

      <ul className={`mt-4 ${listBox}`}>
        {meal.dishes.map((row) => {
          const ranking = list.find((item) => item.dish_id === row.dish_id);
          return (
            <li key={row.dish_id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-medium">{row.dish.name}</span>
              {row.rank_status === "ranked" && ranking ? (
                <span className="text-sm text-gray-500">
                  #{ranking.rank} · <Score score={ranking.score} />
                </span>
              ) : row.rank_status === "skipped" ? (
                <button
                  type="button"
                  onClick={() => onRankAgain(row.dish_id)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Rank it
                </button>
              ) : (
                <span className="text-sm text-gray-400">Not ranked</span>
              )}
            </li>
          );
        })}
      </ul>

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

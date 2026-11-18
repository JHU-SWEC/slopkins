"use client";

import Link from "next/link";
import { use, useState } from "react";
import { browser } from "react-dom";
import { getHall } from "@/lib/halls";
import {
  getCurrentUserId,
  getMeal,
  getRankedDishes,
  rankDish,
  setRankStatus,
} from "../store";
import type { MealWithDishes, RankedDish, RankStatus } from "../types";
import { RankDish } from "./RankDish";
import { listBox, primaryButton, secondaryButton } from "./styles";
import { Score, TextButton } from "./ui";

/** The rank queue for one logged meal: each rankable dish in turn, then a summary. */
export default function RankMeal({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  use(browser("Meals and rankings are saved in this browser's localStorage."));
  const { meal: mealParam } = use(searchParams);
  const mealId = Number(mealParam);

  const userId = getCurrentUserId();
  const [meal, setMeal] = useState(() => getMeal(mealId));
  const [list, setList] = useState(() => getRankedDishes(userId));

  if (!meal) {
    return (
      <div className="mt-6">
        <p className="text-gray-500">That meal isn&apos;t logged on this device.</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Log a meal
        </Link>
      </div>
    );
  }

  function refresh() {
    setMeal(getMeal(mealId));
    setList(getRankedDishes(userId));
  }
  function setStatus(dishId: number, status: RankStatus) {
    setRankStatus(mealId, dishId, status);
    refresh();
  }

  const rankable = meal.dishes.filter((row) => row.rank_status !== "unrankable");
  const pending = rankable.filter((row) => row.rank_status === "pending");
  const current = pending[0];

  if (!current) {
    return <Summary meal={meal} list={list} onRankAgain={(id) => setStatus(id, "pending")} />;
  }

  const done = rankable.length - pending.length;

  return (
    <>
      <RankDish
        key={current.dish_id}
        dish={current.dish}
        list={list}
        progress={`${mealTitle(meal)} · ${done + 1} of ${rankable.length}`}
        onRank={(result) => {
          rankDish({ ...result, userId, mealId });
          refresh();
        }}
        onKeep={() => setStatus(current.dish_id, "ranked")}
        onSkip={() => setStatus(current.dish_id, "skipped")}
      />
      {pending.length > 1 && (
        <div className="mt-8 border-t border-gray-100 pt-4 text-center">
          <TextButton
            onClick={() => {
              for (const row of pending) setRankStatus(mealId, row.dish_id, "skipped");
              refresh();
            }}
          >
            Skip the rest ({pending.length})
          </TextButton>
        </div>
      )}
    </>
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
        <Link href="/my-list" className={primaryButton}>
          View my list
        </Link>
        <Link href="/feed" className={secondaryButton}>
          Done
        </Link>
      </div>
    </div>
  );
}

export function mealTitle(meal: MealWithDishes): string {
  const hall = getHall(meal.hall_slug)?.name ?? meal.hall_slug;
  return meal.meal ? `${hall} · ${meal.meal[0].toUpperCase()}${meal.meal.slice(1)}` : hall;
}

"use client";

import Link from "next/link";
import { use } from "react";
import { browser } from "react-dom";
import { getCurrentUserId, getMealsWithPendingDishes } from "../store";
import { mealTitle } from "./RankMeal";
import { listBox } from "./styles";

/** Reminds the user about logged dishes they haven't ranked or skipped yet. */
export default function PendingMeals() {
  use(browser("Meals are saved in this browser's localStorage."));
  const meals = getMealsWithPendingDishes(getCurrentUserId());
  if (meals.length === 0) return null;

  return (
    <ul className={`mt-6 ${listBox}`}>
      {meals.map((meal) => {
        const count = meal.dishes.filter((row) => row.rank_status === "pending").length;
        return (
          <li key={meal.id}>
            <Link
              href={`/rank?meal=${meal.id}`}
              className="flex items-center justify-between px-4 py-3 transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">
                  {count} {count === 1 ? "dish" : "dishes"} to rank
                </p>
                <p className="text-sm text-gray-500">{mealTitle(meal)}</p>
              </div>
              <span className="text-sm font-semibold text-blue-600">Rank ›</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

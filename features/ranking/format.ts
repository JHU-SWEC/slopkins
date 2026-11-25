import { getHall } from "@/lib/halls";
import type { Meal } from "./types";

/** "FFC · Lunch", or just "Levering" for kitchens without a meal. */
export function mealTitle(meal: Pick<Meal, "hall_slug" | "meal">): string {
  const hall = getHall(meal.hall_slug)?.name ?? meal.hall_slug;
  return meal.meal ? `${hall} · ${meal.meal[0].toUpperCase()}${meal.meal.slice(1)}` : hall;
}

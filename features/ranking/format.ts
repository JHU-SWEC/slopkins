import { getHall, type HallSlug } from "@/lib/halls";
import type { MealType } from "./types";

/** "FFC · Lunch", or just "Levering" for kitchens without a meal. */
export function mealTitle(meal: { hall_slug: HallSlug | null; meal: MealType | null }): string {
  const hall = meal.hall_slug ? (getHall(meal.hall_slug)?.name ?? meal.hall_slug) : "A dining hall";
  return meal.meal ? `${hall} · ${meal.meal[0].toUpperCase()}${meal.meal.slice(1)}` : hall;
}

/** "Nov 24", in New York time. */
export function mealDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
}

// Show nutrition per serving, or scaled to 100 g so dishes with different
// serving sizes (1 oz of sauce vs 6 oz of chicken) can be compared.
import type { MenuDish, Nutrition } from "@/lib/menus";

export type Basis = "serving" | "100g";

/** Round like a nutrition label: whole calories, one decimal under 10. */
export function roundLikeLabel(key: keyof Nutrition, amount: number) {
  return key === "calories" || amount >= 10 ? Math.round(amount) : Math.round(amount * 10) / 10;
}

/** Every value times factor; a null factor gives all-null values. */
function scaled(nutrition: Nutrition, factor: number | null): Nutrition {
  const result = {} as Nutrition;
  for (const [key, value] of Object.entries(nutrition) as [keyof Nutrition, number | null][]) {
    result[key] = value === null || factor === null ? null : roundLikeLabel(key, value * factor);
  }
  return result;
}

/**
 * The dish's nutrition on the given basis. Per 100 g needs the serving
 * weight, so dishes without one get all-null values.
 */
export function nutritionFor(dish: MenuDish, basis: Basis): Nutrition {
  if (basis === "serving") return dish.nutrition;
  return scaled(dish.nutrition, dish.servingGrams ? 100 / dish.servingGrams : null);
}

/** The dish's nutrition for any number of servings, e.g. 1.5. */
export function nutritionForServings(dish: MenuDish, servings: number): Nutrition {
  return scaled(dish.nutrition, servings);
}

export type MealTotals = {
  nutrition: Nutrition;
  // Nutrients some dish doesn't list, so their totals may be low.
  incomplete: Set<keyof Nutrition>;
};

/**
 * Total nutrition for a meal. Missing values count as zero, and a nutrient
 * is null only when no dish lists it.
 */
export function mealTotals(items: { dish: MenuDish; servings: number }[]): MealTotals {
  const sums = {} as Record<keyof Nutrition, number | null>;
  const incomplete = new Set<keyof Nutrition>();
  for (const { dish, servings } of items) {
    for (const [key, value] of Object.entries(dish.nutrition) as [keyof Nutrition, number | null][]) {
      if (!(key in sums)) sums[key] = null;
      if (value === null) incomplete.add(key);
      else sums[key] = (sums[key] ?? 0) + value * servings;
    }
  }
  const nutrition = {} as Nutrition;
  for (const [key, sum] of Object.entries(sums) as [keyof Nutrition, number | null][]) {
    nutrition[key] = sum === null ? null : roundLikeLabel(key, sum);
    if (sum === null) incomplete.delete(key);
  }
  return { nutrition, incomplete };
}

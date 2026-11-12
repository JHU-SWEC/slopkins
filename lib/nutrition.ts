// Show nutrition per serving, or scaled to 100 g so dishes with different
// serving sizes (1 oz of sauce vs 6 oz of chicken) can be compared.
import type { MenuDish, Nutrition } from "@/lib/menus";

export type Basis = "serving" | "100g";

/**
 * The dish's nutrition on the given basis. Per 100 g needs the serving
 * weight, so dishes without one get all-null values.
 */
export function nutritionFor(dish: MenuDish, basis: Basis): Nutrition {
  if (basis === "serving") return dish.nutrition;
  const factor = dish.servingGrams ? 100 / dish.servingGrams : null;

  const scaled = {} as Nutrition;
  for (const [key, value] of Object.entries(dish.nutrition) as [keyof Nutrition, number | null][]) {
    if (value === null || factor === null) {
      scaled[key] = null;
      continue;
    }
    const amount = value * factor;
    // Same rounding as the label: whole calories, one decimal under 10.
    scaled[key] = key === "calories" || amount >= 10 ? Math.round(amount) : Math.round(amount * 10) / 10;
  }
  return scaled;
}

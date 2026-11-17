// A day's menu for a hall, fetched live from Nutrislice on every request.
// Server-only: Nutrislice doesn't allow browser requests (no CORS).
import "server-only";
import type { Hall, HallMenu } from "@/lib/halls";

const NUTRISLICE = "https://hopkinsdining.api.nutrislice.com/menu/api";

// Nutrition per serving. null means Nutrislice doesn't list that value.
export type Nutrition = {
  calories: number | null;
  fat: number | null; // g
  saturatedFat: number | null; // g
  transFat: number | null; // g
  cholesterol: number | null; // mg
  sodium: number | null; // mg
  carbs: number | null; // g
  fiber: number | null; // g
  sugar: number | null; // g
  addedSugar: number | null; // g
  protein: number | null; // g
  vitaminD: number | null; // mcg
  calcium: number | null; // mg
  iron: number | null; // mg
  potassium: number | null; // mg
};

export type MenuDish = {
  id: number;
  name: string;
  station: string;
  calories: number | null;
  nutrition: Nutrition;
  servingSize: string | null; // e.g. "4 oz"
  servingGrams: number | null; // serving weight, for comparing per 100 g
  ingredients: string | null;
  tags: string[]; // e.g. "Vegan", "Contains Milk"
  isMain: boolean; // an entrée rather than a side, topping or drink; see isMainDish
};

export type MenuTab = {
  label: string;
  meal: HallMenu["meal"];
  dishes: MenuDish[];
};

// Only the Nutrislice fields we use.
type NutrisliceWeek = {
  days?: {
    date: string;
    menu_items?: {
      position?: number;
      text?: string | null;
      is_section_title?: boolean;
      is_station_header?: boolean;
      food?: {
        id: number;
        name: string;
        ingredients?: string | null;
        rounded_nutrition_info?: Record<string, number | null> | null;
        serving_size_info?: {
          serving_size_amount?: string | null;
          serving_size_unit?: string | null;
        } | null;
        icons?: { food_icons?: { name?: string | null }[] } | null;
      } | null;
    }[];
  }[];
};

/** Every tab on the hall's menu page, with the dishes for a YYYY-MM-DD date. */
export async function getMenus(hall: Hall, date: string): Promise<MenuTab[]> {
  return Promise.all(
    hall.menus.map(async (menu) => ({
      label: menu.label,
      meal: menu.meal,
      dishes: await getDishes(hall.schoolSlug, menu.menuTypeSlug, date),
    })),
  );
}

async function getDishes(schoolSlug: string, menuTypeSlug: string, date: string) {
  const [y, m, d] = date.split("-");
  const res = await fetch(
    `${NUTRISLICE}/weeks/school/${schoolSlug}/menu-type/${menuTypeSlug}/${y}/${m}/${d}/`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Nutrislice returned ${res.status} for ${menuTypeSlug}`);
  const week = (await res.json()) as NutrisliceWeek;
  const items = week.days?.find((day) => day.date === date)?.menu_items ?? [];

  // Items come in menu order; station headers are items with text and no food.
  const dishes: MenuDish[] = [];
  const seen = new Set<string>();
  let station = "Menu";
  for (const item of [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    if (item.is_station_header || item.is_section_title || (!item.food && item.text)) {
      station = item.text?.trim() || "Menu";
      continue;
    }
    const food = item.food;
    if (!food?.id || !food.name?.trim()) continue;
    // Nutrislice sometimes lists a dish twice in one station.
    if (seen.has(`${station}:${food.id}`)) continue;
    seen.add(`${station}:${food.id}`);

    const nutrition = toNutrition(food.rounded_nutrition_info ?? {});
    const serving = food.serving_size_info;
    const servingGrams = toGrams(serving?.serving_size_amount, serving?.serving_size_unit);
    dishes.push({
      id: food.id,
      name: food.name.trim(),
      station,
      calories: nutrition.calories,
      nutrition,
      servingSize: serving?.serving_size_amount
        ? `${serving.serving_size_amount} ${serving.serving_size_unit ?? ""}`.trim()
        : null,
      servingGrams,
      ingredients: food.ingredients?.trim() || null,
      tags: (food.icons?.food_icons ?? []).flatMap((icon) => (icon.name ? [icon.name] : [])),
      isMain: isMainDish(food.name, servingGrams, nutrition),
    });
  }
  return dishes;
}

// Nutrislice doesn't say which dishes are entrées (food_category is always
// empty, and station names are unreliable), so guess from the numbers: a main
// is a real portion with real protein and calories. Tuned on actual JHU menus.
const OZ = 28.3495;
// Protein-heavy extras that pass the numbers but aren't a meal on their own.
const NOT_MAINS =
  /\b(cheerios|loops|charms|puffs|flakes|toast crunch|cereal|granola|oatmeal|yogurt|milk|bread|seasoning|sauce|dressing|liquid egg|egg salad|salami|edamame|juice|chips and)\b|^(halal )?pepperoni$/i;
// Entrées that are lighter on protein, like cheese pizza or a veggie bowl.
const MAIN_NAMES = /\b(pizza|bowl|pho|burrito|sandwich|wrap|lasagna|alfredo|curry|dumplings)\b/i;

function isMainDish(name: string, grams: number | null, n: Nutrition) {
  if (!grams || n.calories === null || NOT_MAINS.test(name)) return false;
  if (grams >= 3 * OZ && n.calories >= 150 && (n.protein ?? 0) >= 12) return true;
  return MAIN_NAMES.test(name) && grams >= 4 * OZ && n.calories >= 200;
}

const GRAMS_PER_UNIT: Record<string, number> = { g: 1, oz: OZ, lb: 453.592 };

// Nearly every Nutrislice serving is in oz. Volume units like "cup" can't be
// turned into a weight, so those return null.
function toGrams(amount?: string | null, unit?: string | null) {
  const value = Number(amount);
  const perUnit = GRAMS_PER_UNIT[unit?.trim().toLowerCase() ?? ""];
  return value > 0 && perUnit ? value * perUnit : null;
}

function toNutrition(raw: Record<string, number | null>): Nutrition {
  // Round like a nutrition label: whole numbers, one decimal under 10.
  const get = (key: string, whole = false) => {
    const value = raw[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return whole || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  };
  return {
    calories: get("calories", true),
    fat: get("g_fat"),
    saturatedFat: get("g_saturated_fat"),
    transFat: get("g_trans_fat"),
    cholesterol: get("mg_cholesterol"),
    sodium: get("mg_sodium"),
    carbs: get("g_carbs"),
    fiber: get("g_fiber"),
    sugar: get("g_sugar"),
    addedSugar: get("g_added_sugar"),
    protein: get("g_protein"),
    vitaminD: get("mcg_vitamin_d"),
    calcium: get("mg_calcium"),
    iron: get("mg_iron"),
    potassium: get("mg_potassium"),
  };
}

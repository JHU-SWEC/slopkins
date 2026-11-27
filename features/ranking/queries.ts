// Server-side reads for meals and rankings. Writes are in actions.ts.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getHall, type HallSlug } from "@/lib/halls";
import { SENTIMENT_ORDER } from "./insertion";
import type {
  Dish,
  MealDish,
  MealType,
  MealWithDishes,
  RankedPlate,
  SavedPlate,
  Sentiment,
  WantToTryItem,
} from "./types";

const DISH_COLUMNS = "id, name, calories, rankable";
const MEAL_COLUMNS = `id, user_id, meal, created_at, photo_path, hall:dining_halls(slug), meal_dishes(dish_id, rank_status, dish:dishes(${DISH_COLUMNS}))`;

type DishRow = { id: number; name: string; calories: number | string | null; rankable: boolean };

// Supabase can return a joined row as an object or a one-item list. Normalize it.
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

function hallSlug(slug: unknown): HallSlug | null {
  return typeof slug === "string" ? (getHall(slug)?.slug ?? null) : null;
}

/** Adds each dish's latest hall and station (dish_places) to its row. */
async function withPlaces(supabase: SupabaseClient, rows: DishRow[]): Promise<Map<number, Dish>> {
  const ids = [...new Set(rows.map((row) => row.id))];
  const { data } = ids.length
    ? await supabase.from("dish_places").select("dish_id, hall_slug, station").in("dish_id", ids)
    : { data: [] };
  const places = new Map(
    (data ?? []).map((p: { dish_id: number; hall_slug: string | null; station: string | null }) => [
      p.dish_id,
      p,
    ]),
  );
  return new Map(
    rows.map((row) => {
      const place = places.get(row.id);
      return [
        row.id,
        {
          id: row.id,
          name: row.name,
          calories: row.calories === null ? null : Number(row.calories),
          rankable: row.rankable,
          station: place?.station ?? null,
          hall_slug: hallSlug(place?.hall_slug),
        },
      ];
    }),
  );
}

/**
 * A user's ranked plates, best first (liked, then fine, then disliked), with
 * rank and what was on each plate. Deleted posts drop out (meals RLS hides them).
 */
export async function getRankedPlates(supabase: SupabaseClient, userId: string): Promise<RankedPlate[]> {
  const { data } = await supabase
    .from("plate_rankings")
    .select(
      "meal_id, sentiment, score, comment, meal:meals!inner(meal, created_at, photo_path, hall:dining_halls(slug), meal_dishes(dish:dishes(name)))",
    )
    .eq("user_id", userId)
    .order("score", { ascending: false });

  type Row = { meal_id: number; sentiment: Sentiment; score: number | string; comment: string | null; meal: unknown };
  const rows = (data ?? []) as Row[];

  // Scores are in non-overlapping bands, so score order is list order; sort by
  // sentiment too in case a band was ever off.
  return SENTIMENT_ORDER.flatMap((s) => rows.filter((row) => row.sentiment === s)).flatMap((row, index) => {
    const meal = one<{
      meal: MealType | null;
      created_at: string;
      photo_path: string | null;
      hall: unknown;
      meal_dishes: { dish: unknown }[];
    }>(
      row.meal,
    );
    if (!meal) return [];
    return [
      {
        meal_id: row.meal_id,
        sentiment: row.sentiment,
        score: Number(row.score),
        comment: row.comment,
        rank: index + 1,
        hall_slug: hallSlug(one<{ slug: string }>(meal.hall)?.slug),
        meal: meal.meal,
        created_at: meal.created_at,
        dish_names: (meal.meal_dishes ?? []).flatMap((md) => one<{ name: string }>(md.dish)?.name ?? []),
        photo_path: meal.photo_path,
      },
    ];
  });
}

type MealRow = {
  id: number;
  user_id: string;
  meal: MealType | null;
  created_at: string;
  photo_path: string | null;
  hall: unknown;
  meal_dishes: { dish_id: number; rank_status: MealDish["rank_status"]; dish: unknown }[];
};

async function toMeals(supabase: SupabaseClient, rows: MealRow[]): Promise<MealWithDishes[]> {
  const dishes = await withPlaces(
    supabase,
    rows.flatMap((row) => row.meal_dishes.flatMap((md) => one<DishRow>(md.dish) ?? [])),
  );
  return rows.flatMap((row) => {
    const slug = hallSlug(one<{ slug: string }>(row.hall)?.slug);
    if (!slug) return [];
    return [
      {
        id: row.id,
        user_id: row.user_id,
        hall_slug: slug,
        meal: row.meal,
        created_at: row.created_at,
        photo_path: row.photo_path,
        dishes: row.meal_dishes.flatMap((md) => {
          const dish = dishes.get(md.dish_id);
          // The meal's hall is where this dish was eaten, so prefer it.
          return dish
            ? [{ meal_id: row.id, dish_id: md.dish_id, rank_status: md.rank_status, dish: { ...dish, hall_slug: slug } }]
            : [];
        }),
      },
    ];
  });
}

export async function getMeal(supabase: SupabaseClient, mealId: number): Promise<MealWithDishes | null> {
  if (!Number.isInteger(mealId) || mealId <= 0) return null;
  const { data } = await supabase.from("meals").select(MEAL_COLUMNS).eq("id", mealId).maybeSingle();
  if (!data) return null;
  return (await toMeals(supabase, [data as MealRow]))[0] ?? null;
}

/** A user's recent plates still waiting to be ranked, newest first. */
export async function getMealsWithPendingDishes(
  supabase: SupabaseClient,
  userId: string,
): Promise<MealWithDishes[]> {
  const { data } = await supabase
    .from("meals")
    .select(MEAL_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  const pending = ((data ?? []) as MealRow[]).filter((row) =>
    row.meal_dishes.some((md) => md.rank_status === "pending"),
  );
  return toMeals(supabase, pending);
}

/**
 * Dishes a user saved to Want to try, newest first. Public (anyone can read
 * dish_alerts); only the owner can change them.
 */
export async function getWantToTry(supabase: SupabaseClient, userId: string): Promise<WantToTryItem[]> {
  const { data } = await supabase
    .from("dish_alerts")
    .select(`created_at, dish:dishes(${DISH_COLUMNS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as { created_at: string; dish: unknown }[];
  const dishes = await withPlaces(
    supabase,
    rows.flatMap((row) => one<DishRow>(row.dish) ?? []),
  );
  return rows.flatMap((row) => {
    const dish = dishes.get(one<DishRow>(row.dish)?.id ?? 0);
    return dish ? [{ dish, saved_at: row.created_at }] : [];
  });
}

/** Nutrislice food ids of the user's Want to try dishes, for the bookmarks on a menu. */
export async function getWantToTryFoodIds(supabase: SupabaseClient, userId: string): Promise<number[]> {
  const { data } = await supabase
    .from("dish_alerts")
    .select("dish:dishes(nutrislice_food_id)")
    .eq("user_id", userId);
  return ((data ?? []) as { dish: unknown }[]).flatMap((row) => {
    const id = one<{ nutrislice_food_id: number }>(row.dish)?.nutrislice_food_id;
    return typeof id === "number" ? [id] : [];
  });
}

/** Plates a user saved from other people's posts, newest first. Public. */
export async function getSavedPlates(supabase: SupabaseClient, userId: string): Promise<SavedPlate[]> {
  const { data } = await supabase
    .from("saved_plates")
    .select(
      "id, meal_id, meal, dish_ids, created_at, hall:dining_halls(slug, name), source:meals(person:profiles!meals_user_id_fkey(username, display_name))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Record<string, unknown>[];

  // One lookup for every dish name across the plates.
  const ids = [...new Set(rows.flatMap((row) => row.dish_ids as number[]))];
  const { data: dishRows } =
    ids.length === 0 ? { data: [] } : await supabase.from("dishes").select("id, name").in("id", ids);
  const names = new Map((dishRows ?? []).map((dish) => [dish.id as number, dish.name as string]));

  return rows.map((row) => ({
    id: row.id as number,
    meal_id: (row.meal_id as number | null) ?? null,
    hall: one<{ slug: string; name: string }>(row.hall),
    meal: (row.meal as string | null) ?? null,
    dishes: (row.dish_ids as number[]).flatMap((id) => {
      const name = names.get(id);
      return name ? [{ id, name }] : [];
    }),
    from: one<{ username: string; display_name: string | null }>(one<{ person: unknown }>(row.source)?.person),
    saved_at: row.created_at as string,
  }));
}

/** An item's community score: the average of every ranked plate it was on. */
export type DishScore = { score: number; plates: number };

/**
 * Community scores for menu items, keyed by Nutrislice food id (what menus
 * use). Items no ranked plate has included are left out.
 */
export async function getDishScoresByFoodId(
  supabase: SupabaseClient,
  foodIds: number[],
): Promise<Record<number, DishScore>> {
  if (foodIds.length === 0) return {};
  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, nutrislice_food_id")
    .in("nutrislice_food_id", [...new Set(foodIds)]);
  const foodIdOf = new Map((dishes ?? []).map((d) => [d.id as number, d.nutrislice_food_id as number]));
  if (foodIdOf.size === 0) return {};

  const { data: scores } = await supabase
    .from("dish_scores")
    .select("dish_id, avg_score, num_rankings")
    .in("dish_id", [...foodIdOf.keys()]);
  const byFoodId: Record<number, DishScore> = {};
  for (const row of scores ?? []) {
    const foodId = foodIdOf.get(row.dish_id as number);
    if (foodId === undefined || row.avg_score === null) continue;
    byFoodId[foodId] = { score: Number(row.avg_score), plates: Number(row.num_rankings) };
  }
  return byFoodId;
}

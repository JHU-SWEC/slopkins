// Server-side reads for meals and rankings. Writes are in actions.ts.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getHall, type HallSlug } from "@/lib/halls";
import { SENTIMENT_ORDER } from "./insertion";
import type { Dish, MealDish, MealType, MealWithDishes, RankedDish, Ranking } from "./types";

const DISH_COLUMNS = "id, name, calories, rankable";
const MEAL_COLUMNS = `id, user_id, meal, created_at, hall:dining_halls(slug), meal_dishes(dish_id, rank_status, dish:dishes(${DISH_COLUMNS}))`;

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

/** A user's list, best first (liked, then fine, then disliked), with rank and dish details. */
export async function getRankedDishes(supabase: SupabaseClient, userId: string): Promise<RankedDish[]> {
  const { data } = await supabase
    .from("rankings")
    .select(`user_id, dish_id, sentiment, score, comment, created_at, updated_at, dish:dishes(${DISH_COLUMNS})`)
    .eq("user_id", userId)
    .order("score", { ascending: false });

  const rows = (data ?? []) as (Omit<Ranking, "score"> & { score: number | string; dish: unknown })[];
  const dishes = await withPlaces(
    supabase,
    rows.flatMap((row) => one<DishRow>(row.dish) ?? []),
  );

  // Scores are in non-overlapping bands, so score order is list order; sort by
  // sentiment too in case a row was written before the band check existed.
  return SENTIMENT_ORDER.flatMap((s) => rows.filter((row) => row.sentiment === s)).flatMap(
    (row, index) => {
      const dish = dishes.get(row.dish_id);
      if (!dish) return [];
      return [
        {
          user_id: row.user_id,
          dish_id: row.dish_id,
          sentiment: row.sentiment,
          score: Number(row.score),
          comment: row.comment,
          created_at: row.created_at,
          updated_at: row.updated_at,
          rank: index + 1,
          dish,
        },
      ];
    },
  );
}

type MealRow = {
  id: number;
  user_id: string;
  meal: MealType | null;
  created_at: string;
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

/** A user's recent meals that still have dishes waiting to be ranked, newest first. */
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

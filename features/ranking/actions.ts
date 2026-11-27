"use server";

// Writes for meals and rankings. Reads are in queries.ts.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { pickMenuDate, todayISO } from "@/lib/dates";
import { getHall } from "@/lib/halls";
import { getMenus, type FullDish } from "@/lib/menus";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import { SENTIMENT_ORDER } from "./insertion";
import { MEAL_PHOTO_PATH } from "./photo";
import { getRankedPlates } from "./queries";
import type { RankPlateInput, RankedPlate, Sentiment } from "./types";

export type ActionResult = { error?: string };

const MAX_DISHES = 50;
const MAX_CAPTION = 500;

function isId(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  return { supabase, user };
}

type Hall = NonNullable<ReturnType<typeof getHall>>;

/**
 * Finds the dishes on a hall's menu for `date` (Nutrislice, fetched here), then
 * makes sure each has a `dishes` row and a `menu_items` row for that day.
 * Returns Nutrislice food id -> dishes.id, and the hall's id.
 */
async function recordDishes(
  hall: Hall,
  menuTypeSlug: string,
  date: string,
  foodIds: number[],
): Promise<{ dishIds: Map<number, number>; hallId: number } | { error: string }> {
  let tabs;
  try {
    tabs = await getMenus(hall, date);
  } catch {
    return { error: "Couldn't reach the dining hall menu. Try again in a bit." };
  }

  // Look in the tab the dish came from first. Levering kitchens share one
  // meal, so their dishes can come from any of the hall's tabs.
  const ordered = [
    ...tabs.filter((tab) => tab.menuTypeSlug === menuTypeSlug),
    ...tabs.filter((tab) => tab.menuTypeSlug !== menuTypeSlug),
  ];
  const picked: { menuTypeSlug: string; dish: FullDish }[] = [];
  for (const foodId of foodIds) {
    const tab = ordered.find((t) => t.dishes.some((dish) => dish.id === foodId));
    const dish = tab?.dishes.find((d) => d.id === foodId);
    if (!tab || !dish) return { error: "Some of those dishes aren't on the menu anymore." };
    picked.push({ menuTypeSlug: tab.menuTypeSlug, dish });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    console.error("[ranking] SUPABASE_SECRET_KEY is missing, so dishes can't be saved.");
    return { error: "Saving dishes isn't set up on this server yet." };
  }

  // The hall's menus and the dish rows don't depend on each other, so both
  // go out at once (each round trip to Supabase adds up).
  const [{ data: menus }, inserted] = await Promise.all([
    admin
      .from("nutrislice_menus")
      .select("id, menu_type_slug, dining_hall_id")
      .eq("school_slug", hall.schoolSlug)
      .in("menu_type_slug", [...new Set(picked.map((p) => p.menuTypeSlug))]),
    // New dishes get rankable from isMain. Existing rows are left alone, so an
    // admin's fix to rankable sticks.
    admin.from("dishes").upsert(
      picked.map(({ dish }) => ({
        nutrislice_food_id: dish.id,
        name: dish.name,
        calories: dish.nutrition.calories,
        protein_g: dish.nutrition.protein,
        carbs_g: dish.nutrition.carbs,
        fat_g: dish.nutrition.fat,
        serving_size: dish.servingSize,
        dietary_tags: dish.tags,
        rankable: dish.isMain,
      })),
      { onConflict: "nutrislice_food_id", ignoreDuplicates: true },
    ),
  ]);
  const menuIds = new Map((menus ?? []).map((m) => [m.menu_type_slug, m]));
  const hallId = menus?.[0]?.dining_hall_id;
  if (!hallId || picked.some((p) => !menuIds.has(p.menuTypeSlug))) {
    return { error: "This dining hall isn't set up in the database yet." };
  }

  const { data: dishRows } = await admin
    .from("dishes")
    .select("id, nutrislice_food_id")
    .in("nutrislice_food_id", foodIds);
  const dishIds = new Map((dishRows ?? []).map((d) => [d.nutrislice_food_id, d.id]));
  if (inserted.error || dishIds.size !== foodIds.length) {
    console.error("[ranking] saving dishes failed", inserted.error);
    return { error: "Couldn't save that. Please try again." };
  }

  // Where and when each dish was served. Nothing below needs it, so it runs
  // after the response instead of making the person wait.
  after(async () => {
    const served = await admin.from("menu_items").upsert(
      picked.map(({ menuTypeSlug: slug, dish }) => ({
        nutrislice_menu_id: menuIds.get(slug)!.id,
        dish_id: dishIds.get(dish.id)!,
        served_on: date,
        station: dish.station,
      })),
      { onConflict: "nutrislice_menu_id,dish_id,served_on", ignoreDuplicates: true },
    );
    if (served.error) console.warn("[ranking] saving menu items failed", served.error);
  });

  return { dishIds, hallId };
}

/**
 * Saves today's meal and its ranking together, once ranking is done, so a
 * plate is never posted unranked. Leaving mid-ranking saves nothing.
 * The browser only sends Nutrislice food ids: dish names and nutrition come
 * from Nutrislice here on the server, so nobody can invent a dish.
 * On success, returns the new meal's id and your updated list.
 */
export async function logAndRankMealAction(input: {
  hallSlug: string;
  /** The menu tab the meal was picked from; sets breakfast / lunch / dinner. */
  menuTypeSlug: string;
  foodIds: number[];
  /** Optional photo, already uploaded to the meal-photos bucket by the browser. */
  photoPath?: string | null;
  /** Optional caption for the post. */
  caption?: string | null;
  sentiment: Sentiment;
  /** 0-based index in the sentiment group, from the comparisons. */
  position: number;
}): Promise<ActionResult & { mealId?: number; list?: RankedPlate[] }> {
  const { supabase, user } = await signedIn();
  if (!user) redirect("/login");

  const hall = getHall(input.hallSlug);
  const current = hall?.menus.find((menu) => menu.menuTypeSlug === input.menuTypeSlug);
  if (!hall || !current) return { error: "That menu couldn't be found." };

  const foodIds = [...new Set(input.foodIds)].filter(isId);
  if (foodIds.length === 0) return { error: "Pick at least one dish." };
  if (foodIds.length > MAX_DISHES) return { error: `A meal can have up to ${MAX_DISHES} dishes.` };

  const photoPath = input.photoPath || null;
  if (photoPath && (!MEAL_PHOTO_PATH.test(photoPath) || !photoPath.startsWith(`${user.id}/`))) {
    return { error: "That photo couldn't be used. Try adding it again." };
  }

  if (!SENTIMENT_ORDER.includes(input.sentiment) || !Number.isInteger(input.position) || input.position < 0) {
    return { error: "Couldn't save that ranking." };
  }

  // Meals are logged on the day they're eaten.
  const recorded = await recordDishes(hall, current.menuTypeSlug, todayISO(), foodIds);
  if ("error" in recorded) return recorded;
  const { dishIds, hallId } = recorded;

  // The meal itself is written as the user, so RLS applies.
  const { data: mealId, error } = await supabase.rpc("log_meal", {
    p_dining_hall_id: hallId,
    p_meal: current.meal,
    p_dish_ids: foodIds.map((id) => dishIds.get(id)!),
    p_rank: true,
    p_photo_path: photoPath ?? undefined,
    p_caption: input.caption?.trim().slice(0, MAX_CAPTION) || undefined,
  });
  if (error || typeof mealId !== "number") {
    console.error("[ranking] log_meal failed", error);
    return { error: "Couldn't save your meal. Please try again." };
  }

  const ranked = await supabase.rpc("rank_plate", {
    p_meal_id: mealId,
    p_sentiment: input.sentiment,
    p_position: input.position,
    p_comment: null,
  });
  if (ranked.error) {
    // Don't leave an unranked post behind: take the meal back down.
    console.error("[ranking] rank_plate failed", ranked.error);
    await supabase.rpc("soft_delete_meal", { p_meal_id: mealId });
    return { error: "Couldn't save your ranking. Please try again." };
  }

  // You've tried these dishes now, so they come off Want to try. Not shown on
  // the result screen, so it runs after the response.
  after(async () => {
    await supabase
      .from("dish_alerts")
      .delete()
      .eq("user_id", user.id)
      .in("dish_id", foodIds.map((id) => dishIds.get(id)!));
  });

  return { mealId, list: await getRankedPlates(supabase, user.id) };
}

/** Places one of your plates on your list (see rank_plate in the migrations). */
export async function rankPlateAction(input: RankPlateInput): Promise<ActionResult> {
  const { supabase, user } = await signedIn();
  if (!user) return { error: "Log in to rank plates." };

  const valid =
    isId(input.mealId) &&
    SENTIMENT_ORDER.includes(input.sentiment) &&
    Number.isInteger(input.position) &&
    input.position >= 0;
  if (!valid) return { error: "Couldn't save that ranking." };

  const comment = input.comment?.trim().slice(0, 500) || null;
  const { error } = await supabase.rpc("rank_plate", {
    p_meal_id: input.mealId,
    p_sentiment: input.sentiment,
    p_position: input.position,
    p_comment: comment,
  });
  if (error) {
    console.error("[ranking] rank_plate failed", error);
    return { error: "Couldn't save that ranking. Please try again." };
  }

  // You've tried these dishes now, so they come off Want to try.
  const { data: eaten } = await supabase.from("meal_dishes").select("dish_id").eq("meal_id", input.mealId);
  const dishIds = (eaten ?? []).map((row) => row.dish_id as number);
  if (dishIds.length > 0) {
    await supabase.from("dish_alerts").delete().eq("user_id", user.id).in("dish_id", dishIds);
  }

  refresh();
  return {};
}

/** Put a plate back in the queue, to rank it (again). */
export async function rerankPlateAction(mealId: number): Promise<ActionResult> {
  const { supabase, user } = await signedIn();
  if (!user) return { error: "Log in to rank plates." };
  if (!isId(mealId)) return { error: "Couldn't update that plate." };

  // RLS only allows rows on your own meals. Includes 'unrankable' rows from
  // before plates of sides could be ranked.
  const { error } = await supabase.from("meal_dishes").update({ rank_status: "pending" }).eq("meal_id", mealId);
  if (error) return { error: "Couldn't update that plate. Please try again." };

  refresh();
  return {};
}

// ------------------------------------------------------------
// Want to try: dishes you've saved, stored in dish_alerts.
// dish_alerts RLS lets only you read or change your own rows.
// ------------------------------------------------------------

/**
 * Bookmark (save = true) or un-bookmark a dish on a hall's menu. Works on
 * future days too, so you can save something you see coming up.
 */
export async function setWantToTryAction(input: {
  hallSlug: string;
  menuTypeSlug: string;
  /** The menu's day, YYYY-MM-DD; anything outside the browsable week means today. */
  date: string;
  foodId: number;
  save: boolean;
}): Promise<ActionResult> {
  const { supabase, user } = await signedIn();
  if (!user) return { error: "Log in to save dishes." };

  const hall = getHall(input.hallSlug);
  const menu = hall?.menus.find((m) => m.menuTypeSlug === input.menuTypeSlug);
  if (!hall || !menu || !isId(input.foodId)) return { error: "That dish couldn't be found." };

  if (!input.save) {
    const { data: dish } = await supabase
      .from("dishes")
      .select("id")
      .eq("nutrislice_food_id", input.foodId)
      .maybeSingle();
    if (dish) {
      const { error } = await supabase
        .from("dish_alerts")
        .delete()
        .eq("user_id", user.id)
        .eq("dish_id", dish.id);
      if (error) return { error: "Couldn't remove that. Please try again." };
    }
    return {};
  }

  const recorded = await recordDishes(hall, menu.menuTypeSlug, pickMenuDate(input.date), [input.foodId]);
  if ("error" in recorded) return recorded;

  const { error } = await supabase
    .from("dish_alerts")
    .insert({ user_id: user.id, dish_id: recorded.dishIds.get(input.foodId)! });
  // 23505 = already saved, which is what we wanted.
  if (error && error.code !== "23505") {
    console.error("[ranking] saving want to try failed", error);
    return { error: "Couldn't save that. Please try again." };
  }
  return {};
}

/** Take a dish off Want to try (from the profile). */
export async function removeWantToTryAction(dishId: number): Promise<ActionResult> {
  const { supabase, user } = await signedIn();
  if (!user) return { error: "Log in to change your list." };
  if (!isId(dishId)) return { error: "Couldn't remove that." };

  const { error } = await supabase.from("dish_alerts").delete().eq("user_id", user.id).eq("dish_id", dishId);
  if (error) return { error: "Couldn't remove that. Please try again." };

  refresh();
  return {};
}

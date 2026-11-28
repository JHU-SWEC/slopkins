// Field names are snake_case so these types match Supabase rows.
// See supabase/migrations/20261118120000_meal_logging_and_ranking.sql.

import type { HallSlug } from "@/lib/halls";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export type Sentiment = Enums["sentiment"];
export type RankStatus = Enums["rank_status"];
export type MealType = Enums["meal_type"];

/**
 * A row of `dishes` (id is dishes.id, not the Nutrislice food id) plus where it
 * was last served, from the dish_places view. Place is null if never recorded.
 */
export type Dish = {
  id: number;
  name: string;
  station: string | null;
  calories: number | null;
  rankable: boolean;
  hall_slug: HallSlug | null;
};

/** One of a user's ranked plates (a plate_rankings row) with its place on their list. */
export type RankedPlate = {
  meal_id: number;
  sentiment: Sentiment;
  /** Higher is better; sentiment bands never overlap. */
  score: number;
  comment: string | null;
  /** 1-based position on the whole list. */
  rank: number;
  hall_slug: HallSlug | null;
  meal: MealType | null;
  created_at: string;
  dish_names: string[];
  /** Path in the meal-photos bucket, or null if the meal has no photo. */
  photo_path: string | null;
};

/** A logged meal: one visit to one hall. */
export type Meal = {
  id: number;
  user_id: string;
  hall_slug: HallSlug;
  meal: MealType | null;
  created_at: string;
  /** Path in the meal-photos bucket, or null if the meal has no photo. */
  photo_path: string | null;
};

/** One dish in a logged meal and where it stands in the rank queue. */
export type MealDish = {
  meal_id: number;
  dish_id: number;
  rank_status: RankStatus;
};

export type MealWithDishes = Meal & { dishes: (MealDish & { dish: Dish })[] };

/** What rank_plate() needs. */
export type RankPlateInput = {
  mealId: number;
  sentiment: Sentiment;
  /** 0-based index in the sentiment group, not counting this plate. */
  position: number;
  comment: string | null;
};

/** A dish on your Want to try list (a dish_alerts row). */
export type WantToTryItem = { dish: Dish; saved_at: string };

/** Someone else's plate saved from the feed, as one Want to Try entry. */
export type SavedPlate = {
  id: number;
  /** The post it came from; null once that post is gone. */
  meal_id: number | null;
  hall: { slug: string; name: string } | null;
  meal: string | null;
  dishes: { id: number; name: string }[];
  /** Whose plate it was, if their post still exists. */
  from: { username: string; display_name: string | null } | null;
  /** The original post's photo, if it has one and still exists. */
  photo_path: string | null;
  saved_at: string;
};

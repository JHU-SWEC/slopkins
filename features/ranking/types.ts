// Field names are snake_case so these types match Supabase rows.
// See supabase/migrations/20261118120000_meal_logging_and_ranking.sql.

import type { HallSlug } from "@/lib/halls";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export type Sentiment = Enums["sentiment"];
export type RankStatus = Enums["rank_status"];
export type MealType = Enums["meal_type"];

/** A dish plus where it's served. `rankable` mirrors dishes.rankable. */
export type Dish = {
  id: number;
  name: string;
  station: string;
  calories: number | null;
  rankable: boolean;
  hall_slug: HallSlug;
};

/** One dish on one user's list. Higher score is better; bands never overlap. */
export type Ranking = {
  user_id: string;
  dish_id: number;
  sentiment: Sentiment;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

/** A ranking with its 1-based position on the whole list and dish details. */
export type RankedDish = Ranking & { rank: number; dish: Dish };

/** One answer to "Is dish X or Y better?". */
export type Comparison = {
  id: number;
  user_id: string;
  winner_dish_id: number;
  loser_dish_id: number;
  created_at: string;
};

/** A logged meal: one visit to one hall. */
export type Meal = {
  id: number;
  user_id: string;
  hall_slug: HallSlug;
  meal: MealType | null;
  created_at: string;
};

/** One dish in a logged meal and where it stands in the rank queue. */
export type MealDish = {
  meal_id: number;
  dish_id: number;
  rank_status: RankStatus;
};

export type MealWithDishes = Meal & { dishes: (MealDish & { dish: Dish })[] };

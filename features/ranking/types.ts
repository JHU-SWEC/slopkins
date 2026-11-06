// Field names are snake_case so these types can match Supabase rows later.

export type DiningHallId = "ffc" | "nolans" | "levering";

export type DiningHall = {
  id: DiningHallId;
  name: string;
  description: string;
};

export type Dish = {
  id: string;
  hall_id: DiningHallId;
  name: string;
  station: string;
};

export type User = {
  id: string;
  display_name: string;
};

export type Sentiment = "liked" | "fine" | "disliked";

/**
 * One dish on one user's list. Rank 1 is that user's favorite.
 * Ranks run across the whole list: all liked, then fine, then disliked.
 */
export type Ranking = {
  user_id: string;
  dish_id: string;
  rank: number;
  sentiment: Sentiment;
  comment: string | null;
  created_at: string;
};

/** One answer to "Is dish X or Y better?". Both dishes share a sentiment. */
export type Comparison = {
  id: string;
  user_id: string;
  winner_dish_id: string;
  loser_dish_id: string;
  created_at: string;
};

export type RankedDish = Ranking & { dish: Dish; hall: DiningHall };

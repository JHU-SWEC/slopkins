// Invented placeholder data, not real menus or students.
// Swap these reads for Supabase queries once the tables exist.

import type {
  Comparison,
  DiningHall,
  Dish,
  RankedDish,
  Ranking,
  User,
} from "./types";

// Stands in for the signed-in user until auth exists.
export const CURRENT_USER_ID = "user-me";

export const diningHalls: DiningHall[] = [
  { id: "ffc", name: "FFC", description: "Fresh Food Cafe" },
  { id: "nolans", name: "Nolan's", description: "Nolan's on 33rd" },
  { id: "levering", name: "Levering", description: "Levering Kitchens" },
];

export const dishes: Dish[] = [
  { id: "ffc-chicken-tenders", hall_id: "ffc", name: "Chicken Tenders", station: "Grill" },
  { id: "ffc-margherita-pizza", hall_id: "ffc", name: "Margherita Pizza", station: "Pizza" },
  { id: "ffc-pasta-marinara", hall_id: "ffc", name: "Pasta Marinara", station: "Pasta" },
  { id: "ffc-veggie-stir-fry", hall_id: "ffc", name: "Veggie Stir Fry", station: "Wok" },
  { id: "ffc-caesar-salad", hall_id: "ffc", name: "Caesar Salad", station: "Salad Bar" },
  { id: "ffc-brownie", hall_id: "ffc", name: "Fudge Brownie", station: "Dessert" },
  { id: "nolans-burger", hall_id: "nolans", name: "Late Night Burger", station: "Grill" },
  { id: "nolans-mozzarella-sticks", hall_id: "nolans", name: "Mozzarella Sticks", station: "Fryer" },
  { id: "nolans-quesadilla", hall_id: "nolans", name: "Chicken Quesadilla", station: "Grill" },
  { id: "nolans-loaded-fries", hall_id: "nolans", name: "Loaded Fries", station: "Fryer" },
  { id: "nolans-breakfast-sandwich", hall_id: "nolans", name: "Breakfast Sandwich", station: "Breakfast" },
  { id: "nolans-mac-and-cheese", hall_id: "nolans", name: "Mac and Cheese", station: "Comfort" },
  { id: "levering-burrito-bowl", hall_id: "levering", name: "Burrito Bowl", station: "Bowls" },
  { id: "levering-ramen", hall_id: "levering", name: "Shoyu Ramen", station: "Noodles" },
  { id: "levering-grilled-cheese", hall_id: "levering", name: "Grilled Cheese", station: "Sandwiches" },
  { id: "levering-tomato-soup", hall_id: "levering", name: "Tomato Soup", station: "Soup" },
  { id: "levering-falafel-wrap", hall_id: "levering", name: "Falafel Wrap", station: "Sandwiches" },
  { id: "levering-pad-thai", hall_id: "levering", name: "Pad Thai", station: "Noodles" },
];

export const users: User[] = [
  { id: CURRENT_USER_ID, display_name: "Demo Blue Jay" },
  { id: "user-friend", display_name: "Demo Friend" },
  // Has no rankings, for building the empty state.
  { id: "user-new", display_name: "Demo Newcomer" },
];

export const rankings: Ranking[] = [
  { user_id: CURRENT_USER_ID, dish_id: "ffc-chicken-tenders", rank: 1, sentiment: "liked", comment: "Worth the line every time.", created_at: "2026-09-02T17:45:00Z" },
  { user_id: CURRENT_USER_ID, dish_id: "nolans-burger", rank: 2, sentiment: "liked", comment: "Peak at 1am.", created_at: "2026-09-05T04:50:00Z" },
  { user_id: CURRENT_USER_ID, dish_id: "levering-burrito-bowl", rank: 3, sentiment: "liked", comment: null, created_at: "2026-09-09T16:20:00Z" },
  { user_id: CURRENT_USER_ID, dish_id: "ffc-margherita-pizza", rank: 4, sentiment: "liked", comment: "Great when it's fresh out of the oven.", created_at: "2026-09-14T23:10:00Z" },
  { user_id: CURRENT_USER_ID, dish_id: "levering-grilled-cheese", rank: 5, sentiment: "fine", comment: null, created_at: "2026-09-21T17:05:00Z" },
  { user_id: CURRENT_USER_ID, dish_id: "ffc-pasta-marinara", rank: 6, sentiment: "fine", comment: "Reliable, not exciting.", created_at: "2026-10-01T22:30:00Z" },
  { user_id: CURRENT_USER_ID, dish_id: "ffc-veggie-stir-fry", rank: 7, sentiment: "disliked", comment: "Needs more sauce.", created_at: "2026-10-12T23:15:00Z" },

  { user_id: "user-friend", dish_id: "levering-ramen", rank: 1, sentiment: "liked", comment: "Best thing on campus.", created_at: "2026-09-03T17:00:00Z" },
  { user_id: "user-friend", dish_id: "nolans-mac-and-cheese", rank: 2, sentiment: "liked", comment: null, created_at: "2026-09-11T03:25:00Z" },
  { user_id: "user-friend", dish_id: "ffc-chicken-tenders", rank: 3, sentiment: "liked", comment: "Overrated, still good.", created_at: "2026-09-18T22:40:00Z" },
  { user_id: "user-friend", dish_id: "levering-falafel-wrap", rank: 4, sentiment: "fine", comment: null, created_at: "2026-10-02T16:35:00Z" },
  { user_id: "user-friend", dish_id: "ffc-caesar-salad", rank: 5, sentiment: "disliked", comment: "Soggy croutons.", created_at: "2026-10-20T23:00:00Z" },
];

export const comparisons: Comparison[] = [
  { id: "cmp-1", user_id: CURRENT_USER_ID, winner_dish_id: "ffc-chicken-tenders", loser_dish_id: "nolans-burger", created_at: "2026-09-05T04:49:00Z" },
  { id: "cmp-2", user_id: CURRENT_USER_ID, winner_dish_id: "nolans-burger", loser_dish_id: "levering-burrito-bowl", created_at: "2026-09-09T16:19:00Z" },
  { id: "cmp-3", user_id: CURRENT_USER_ID, winner_dish_id: "nolans-burger", loser_dish_id: "ffc-margherita-pizza", created_at: "2026-09-14T23:08:30Z" },
  { id: "cmp-4", user_id: CURRENT_USER_ID, winner_dish_id: "levering-burrito-bowl", loser_dish_id: "ffc-margherita-pizza", created_at: "2026-09-14T23:09:00Z" },
  { id: "cmp-5", user_id: CURRENT_USER_ID, winner_dish_id: "levering-grilled-cheese", loser_dish_id: "ffc-pasta-marinara", created_at: "2026-10-01T22:29:30Z" },

  { id: "cmp-6", user_id: "user-friend", winner_dish_id: "levering-ramen", loser_dish_id: "nolans-mac-and-cheese", created_at: "2026-09-11T03:24:00Z" },
  { id: "cmp-7", user_id: "user-friend", winner_dish_id: "nolans-mac-and-cheese", loser_dish_id: "ffc-chicken-tenders", created_at: "2026-09-18T22:39:00Z" },
];

/** A user's list, best dish first, with dish and hall details attached. */
export function getRankedDishes(userId: string): RankedDish[] {
  return rankings
    .filter((ranking) => ranking.user_id === userId)
    .sort((a, b) => a.rank - b.rank)
    .map((ranking) => {
      const dish = dishes.find((d) => d.id === ranking.dish_id)!;
      const hall = diningHalls.find((h) => h.id === dish.hall_id)!;
      return { ...ranking, dish, hall };
    });
}

/** Dishes a user hasn't ranked yet, for the "add a dish" step. */
export function getUnrankedDishes(userId: string): Dish[] {
  const rankedIds = new Set(
    rankings.filter((r) => r.user_id === userId).map((r) => r.dish_id),
  );
  return dishes.filter((dish) => !rankedIds.has(dish.id));
}

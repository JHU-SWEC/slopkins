// Mock data for the skeleton screens. Shaped like the real tables so each
// owner can swap in Supabase queries without changing components. Delete your
// part when the real data lands.
import type { Database } from "@/lib/supabase/database.types";
import type { HallSlug } from "@/lib/halls";

type MealType = Database["public"]["Enums"]["meal_type"];

export type MockFeedPost = {
  id: number;
  username: string;
  displayName: string;
  hallSlug: HallSlug;
  meal: MealType | null;
  postedAgo: string;
  dishes: string[];
};

export const mockFeedPosts: MockFeedPost[] = [
  {
    id: 1,
    username: "kyle",
    displayName: "Kyle Li",
    hallSlug: "ffc",
    meal: "lunch",
    postedAgo: "12m",
    dishes: ["Chicken Tikka Masala", "Basmati Rice", "Caesar Salad"],
  },
  {
    id: 2,
    username: "jonny",
    displayName: "Jonny",
    hallSlug: "levering",
    meal: null,
    postedAgo: "1h",
    dishes: ["General Tso's Chicken", "Vegetable Lo Mein"],
  },
  {
    id: 3,
    username: "amy",
    displayName: "Amy Yang",
    hallSlug: "nolans",
    meal: "dinner",
    postedAgo: "3h",
    dishes: ["Philly Cheesesteak", "Mozzarella Sticks"],
  },
];

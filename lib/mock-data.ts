// Mock data for the skeleton screens. Shaped like the real tables so each
// owner can swap in Supabase queries without changing components. Delete your
// part when the real data lands.
import type { Database } from "@/lib/supabase/database.types";
import type { HallSlug } from "@/lib/halls";

type MealType = Database["public"]["Enums"]["meal_type"];

export type MockDish = {
  id: number;
  name: string;
  station: string;
  calories: number | null;
  // dishes.rankable: sides and staples can be logged but not ranked.
  rankable: boolean;
};

// One tab on a hall's menu page: a meal, or a Levering kitchen (meal is null).
export type MockMenuTab = {
  label: string;
  meal: MealType | null;
  dishes: MockDish[];
};

export type MockFeedPost = {
  id: number;
  username: string;
  displayName: string;
  hallSlug: HallSlug;
  meal: MealType | null;
  postedAgo: string;
  dishes: string[];
};

export const mockMenus: Record<HallSlug, MockMenuTab[]> = {
  ffc: [
    {
      label: "Breakfast",
      meal: "breakfast",
      dishes: [
        { id: 1, name: "Scrambled Eggs", station: "Grill", calories: 180, rankable: true },
        { id: 2, name: "Turkey Sausage", station: "Grill", calories: 120, rankable: true },
        { id: 3, name: "Buttermilk Pancakes", station: "Griddle", calories: 310, rankable: true },
        { id: 4, name: "Greek Yogurt Parfait", station: "Fresh", calories: 220, rankable: true },
      ],
    },
    {
      label: "Lunch",
      meal: "lunch",
      dishes: [
        { id: 5, name: "Chicken Tikka Masala", station: "Global", calories: 420, rankable: true },
        { id: 6, name: "Basmati Rice", station: "Global", calories: 200, rankable: false },
        { id: 7, name: "Margherita Pizza", station: "Pizza", calories: 280, rankable: true },
        { id: 8, name: "Caesar Salad", station: "Salad Bar", calories: 190, rankable: true },
      ],
    },
    {
      label: "Dinner",
      meal: "dinner",
      dishes: [
        { id: 9, name: "Beef Bulgogi", station: "Global", calories: 450, rankable: true },
        { id: 10, name: "Steamed Broccoli", station: "Global", calories: 50, rankable: false },
        { id: 11, name: "Cheeseburger", station: "Grill", calories: 540, rankable: true },
        { id: 12, name: "Chocolate Chip Cookie", station: "Dessert", calories: null, rankable: true },
      ],
    },
  ],
  nolans: [
    {
      label: "Breakfast",
      meal: "breakfast",
      dishes: [
        { id: 13, name: "Breakfast Burrito", station: "Grill", calories: 480, rankable: true },
        { id: 14, name: "Hash Browns", station: "Grill", calories: 150, rankable: true },
      ],
    },
    {
      label: "Lunch",
      meal: "lunch",
      dishes: [
        { id: 15, name: "Chicken Tenders", station: "Grill", calories: 390, rankable: true },
        { id: 16, name: "Curly Fries", station: "Grill", calories: 330, rankable: true },
        { id: 17, name: "Pesto Pasta", station: "Pasta", calories: 410, rankable: true },
      ],
    },
    {
      label: "Dinner",
      meal: "dinner",
      dishes: [
        { id: 18, name: "Philly Cheesesteak", station: "Grill", calories: 620, rankable: true },
        { id: 19, name: "Mozzarella Sticks", station: "Grill", calories: 360, rankable: true },
        { id: 20, name: "Garden Salad", station: "Salad Bar", calories: 90, rankable: true },
      ],
    },
  ],
  levering: [
    {
      label: "Taco",
      meal: null,
      dishes: [
        { id: 21, name: "Carnitas Taco", station: "Taco", calories: 250, rankable: true },
        { id: 22, name: "Black Bean Bowl", station: "Taco", calories: 380, rankable: true },
      ],
    },
    {
      label: "Mosaic Global Kitchen",
      meal: null,
      dishes: [
        { id: 23, name: "Falafel Plate", station: "Mosaic", calories: 520, rankable: true },
        { id: 24, name: "Jasmine Rice", station: "Mosaic", calories: 210, rankable: false },
      ],
    },
    {
      label: "Red Lantern Kitchen",
      meal: null,
      dishes: [
        { id: 25, name: "General Tso's Chicken", station: "Wok", calories: 560, rankable: true },
        { id: 26, name: "Vegetable Lo Mein", station: "Wok", calories: 400, rankable: true },
      ],
    },
    {
      label: "Tossed Kitchen",
      meal: null,
      dishes: [
        { id: 27, name: "Build Your Own Salad", station: "Salads", calories: null, rankable: false },
        { id: 28, name: "Chicken Caesar Wrap", station: "Wraps", calories: 470, rankable: true },
      ],
    },
  ],
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

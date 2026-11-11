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
        { id: 1, name: "Scrambled Eggs", station: "Grill", calories: 180 },
        { id: 2, name: "Turkey Sausage", station: "Grill", calories: 120 },
        { id: 3, name: "Buttermilk Pancakes", station: "Griddle", calories: 310 },
        { id: 4, name: "Greek Yogurt Parfait", station: "Fresh", calories: 220 },
      ],
    },
    {
      label: "Lunch",
      meal: "lunch",
      dishes: [
        { id: 5, name: "Chicken Tikka Masala", station: "Global", calories: 420 },
        { id: 6, name: "Basmati Rice", station: "Global", calories: 200 },
        { id: 7, name: "Margherita Pizza", station: "Pizza", calories: 280 },
        { id: 8, name: "Caesar Salad", station: "Salad Bar", calories: 190 },
      ],
    },
    {
      label: "Dinner",
      meal: "dinner",
      dishes: [
        { id: 9, name: "Beef Bulgogi", station: "Global", calories: 450 },
        { id: 10, name: "Steamed Broccoli", station: "Global", calories: 50 },
        { id: 11, name: "Cheeseburger", station: "Grill", calories: 540 },
        { id: 12, name: "Chocolate Chip Cookie", station: "Dessert", calories: null },
      ],
    },
  ],
  nolans: [
    {
      label: "Breakfast",
      meal: "breakfast",
      dishes: [
        { id: 13, name: "Breakfast Burrito", station: "Grill", calories: 480 },
        { id: 14, name: "Hash Browns", station: "Grill", calories: 150 },
      ],
    },
    {
      label: "Lunch",
      meal: "lunch",
      dishes: [
        { id: 15, name: "Chicken Tenders", station: "Grill", calories: 390 },
        { id: 16, name: "Curly Fries", station: "Grill", calories: 330 },
        { id: 17, name: "Pesto Pasta", station: "Pasta", calories: 410 },
      ],
    },
    {
      label: "Dinner",
      meal: "dinner",
      dishes: [
        { id: 18, name: "Philly Cheesesteak", station: "Grill", calories: 620 },
        { id: 19, name: "Mozzarella Sticks", station: "Grill", calories: 360 },
        { id: 20, name: "Garden Salad", station: "Salad Bar", calories: 90 },
      ],
    },
  ],
  levering: [
    {
      label: "Taco",
      meal: null,
      dishes: [
        { id: 21, name: "Carnitas Taco", station: "Taco", calories: 250 },
        { id: 22, name: "Black Bean Bowl", station: "Taco", calories: 380 },
      ],
    },
    {
      label: "Mosaic Global Kitchen",
      meal: null,
      dishes: [
        { id: 23, name: "Falafel Plate", station: "Mosaic", calories: 520 },
        { id: 24, name: "Jasmine Rice", station: "Mosaic", calories: 210 },
      ],
    },
    {
      label: "Red Lantern Kitchen",
      meal: null,
      dishes: [
        { id: 25, name: "General Tso's Chicken", station: "Wok", calories: 560 },
        { id: 26, name: "Vegetable Lo Mein", station: "Wok", calories: 400 },
      ],
    },
    {
      label: "Tossed Kitchen",
      meal: null,
      dishes: [
        { id: 27, name: "Build Your Own Salad", station: "Salads", calories: null },
        { id: 28, name: "Chicken Caesar Wrap", station: "Wraps", calories: 470 },
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

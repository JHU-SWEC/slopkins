import type { Database } from "@/lib/supabase/database.types";

type MealType = Database["public"]["Enums"]["meal_type"];

// One tab on a hall's menu page: a meal, or a Levering kitchen (meal is null).
// Slugs are Nutrislice's; list them all at
// https://hopkinsdining.api.nutrislice.com/menu/api/schools/
export type HallMenu = {
  label: string;
  meal: MealType | null;
  menuTypeSlug: string;
};

// The three JHU dining halls.
export const halls = [
  {
    slug: "ffc",
    name: "FFC",
    description: "Fresh Food Cafe",
    schoolSlug: "hopkins-cafe",
    menus: [
      { label: "Breakfast", meal: "breakfast", menuTypeSlug: "hopkins-cafe-breakfast" },
      { label: "Lunch", meal: "lunch", menuTypeSlug: "hopkins-cafe-lunch" },
      { label: "Dinner", meal: "dinner", menuTypeSlug: "hopkins-cafe-dinner" },
    ],
  },
  {
    slug: "nolans",
    name: "Nolan's",
    description: "Nolan's on 33rd",
    schoolSlug: "nolans-on-33rd",
    menus: [
      { label: "Breakfast", meal: "breakfast", menuTypeSlug: "nolans-breakfast" },
      // Nutrislice really calls Nolan's lunch "dinner-2".
      { label: "Lunch", meal: "lunch", menuTypeSlug: "nolans-dinner-2" },
      { label: "Dinner", meal: "dinner", menuTypeSlug: "nolans-dinner" },
    ],
  },
  {
    slug: "levering",
    name: "Levering",
    description: "Levering Kitchens",
    schoolSlug: "site-1",
    menus: [
      { label: "Taco Kitchen", meal: null, menuTypeSlug: "butterfly" },
      { label: "Mosaic Global Kitchen", meal: null, menuTypeSlug: "mosaic-global-kitchen" },
      { label: "Red Lantern Kitchen", meal: null, menuTypeSlug: "red-lantern-kitchen" },
      { label: "Tossed Kitchen", meal: null, menuTypeSlug: "tossed-kitchen" },
    ],
  },
] as const satisfies readonly {
  slug: string;
  name: string;
  description: string;
  schoolSlug: string;
  menus: readonly HallMenu[];
}[];

export type Hall = (typeof halls)[number];
export type HallSlug = Hall["slug"];

export function getHall(slug: string): Hall | undefined {
  return halls.find((hall) => hall.slug === slug);
}

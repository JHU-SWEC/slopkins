// The three JHU dining halls. Replace with a `dining_halls` query once that
// table is seeded.
export const halls = [
  { slug: "ffc", name: "FFC", description: "Fresh Food Cafe" },
  { slug: "nolans", name: "Nolan's", description: "Nolan's on 33rd" },
  { slug: "levering", name: "Levering", description: "Levering Kitchens" },
] as const;

export type Hall = (typeof halls)[number];
export type HallSlug = Hall["slug"];

export function getHall(slug: string): Hall | undefined {
  return halls.find((hall) => hall.slug === slug);
}

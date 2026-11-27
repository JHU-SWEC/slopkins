// A meal picked on a hall's menu but not saved yet. Nothing is written to the
// database until it's ranked (logAndRankMealAction), so the menu hands it to
// /rank through sessionStorage: it lasts for the tab, survives a refresh, and
// vanishes when the tab closes. Browser only.
import type { HallSlug } from "@/lib/halls";
import type { MealType, MealWithDishes } from "./types";

export type MealDraft = {
  hallSlug: HallSlug;
  menuTypeSlug: string;
  meal: MealType | null;
  /** Nutrislice food ids, in the order picked. */
  foodIds: number[];
  /** Dish names for showing the plate while ranking; the server re-reads the real ones. */
  dishNames: string[];
  photoPath: string | null;
  caption: string;
  /** ISO timestamp of when it was picked. */
  createdAt: string;
};

const KEY = "slopkins:meal-draft";

export function saveDraft(draft: MealDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked (private mode): /rank shows "nothing to rank".
  }
}

/** The raw stored draft, or null. A string, so it's a stable snapshot for useSyncExternalStore. */
export function readDraftRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseDraft(raw: string | null): MealDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as MealDraft;
    return Array.isArray(draft.foodIds) && draft.foodIds.length > 0 ? draft : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * The draft shaped like a saved meal, so the rank steps and summary can show
 * it. `id` is 0 until it's saved, then the real meal id.
 */
export function draftAsMeal(draft: MealDraft, id = 0): MealWithDishes {
  return {
    id,
    user_id: "",
    hall_slug: draft.hallSlug,
    meal: draft.meal,
    created_at: draft.createdAt,
    photo_path: draft.photoPath,
    dishes: draft.foodIds.map((foodId, index) => ({
      meal_id: id,
      dish_id: foodId,
      rank_status: "pending",
      dish: {
        id: foodId,
        name: draft.dishNames[index] ?? "",
        station: null,
        calories: null,
        rankable: true,
        hall_slug: draft.hallSlug,
      },
    })),
  };
}

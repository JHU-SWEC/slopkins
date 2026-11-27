import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../profile/shared";
import { getRelationships } from "../social/queries";

type PersonBasics = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

/** One line on the Activity page. `at` is an ISO timestamp. */
export type ActivityItem =
  | {
      kind: "follow";
      key: string;
      at: string;
      person: PersonBasics;
      /** For the Follow back button. */
      iFollow: boolean;
    }
  | {
      kind: "save";
      key: string;
      at: string;
      person: PersonBasics;
      /** Which of your meals they saved to Want to Try. */
      hall: { slug: string; name: string } | null;
      meal: string | null;
    }
  | {
      kind: "comment";
      key: string;
      at: string;
      person: PersonBasics;
      /** Which of your meals they commented on. */
      hall: { slug: string; name: string } | null;
      meal: string | null;
      body: string;
    }
  | {
      kind: "like";
      key: string;
      at: string;
      person: PersonBasics;
      /** Which of your meals they liked. */
      hall: { slug: string; name: string } | null;
      meal: string | null;
    };

const PERSON = "id, username, display_name, avatar_url";
const DAYS_BACK = 30;
const MAX_ITEMS = 60;

// Supabase can return a joined row as an object or a one-item list. Normalize it.
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

/**
 * Everything for the Activity page, newest first, plus the time it was loaded:
 * - people who started following you
 * - people who liked, commented on, or saved (Want to Try) your meals
 * Only things done to you: what people you follow log or rank isn't here
 * (that's the feed). Built from existing tables (follows, meal_likes,
 * meal_comments, saved_plates), so no extra "notifications" table is needed.
 */
export async function getActivity(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<{ items: ActivityItem[]; now: number }> {
  // Also returned, so "3h ago" is measured from the same moment.
  const now = Date.now();
  const since = new Date(now - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();

  const [newFollowers, likesOnMine, commentsOnMine, savesOfMine] = await Promise.all([
    supabase
      .from("follows")
      .select(`created_at, person:profiles!follows_follower_id_fkey(${PERSON})`)
      .eq("followee_id", viewerId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    // Likes other people left on your meals.
    supabase
      .from("meal_likes")
      .select(
        `meal_id, created_at, person:profiles!meal_likes_user_id_fkey(${PERSON}), meal:meals!inner(user_id, meal, hall:dining_halls(slug, name))`,
      )
      .eq("meal.user_id", viewerId)
      .neq("user_id", viewerId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    // Comments other people left on your meals.
    supabase
      .from("meal_comments")
      .select(
        `id, body, created_at, person:profiles!meal_comments_user_id_fkey(${PERSON}), meal:meals!inner(user_id, meal, hall:dining_halls(slug, name))`,
      )
      .eq("meal.user_id", viewerId)
      .neq("user_id", viewerId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    // People who saved one of your meals to their Want to Try.
    supabase
      .from("saved_plates")
      .select(
        `id, created_at, person:profiles!saved_plates_user_id_fkey(${PERSON}), meal:meals!inner(user_id, meal, hall:dining_halls(slug, name))`,
      )
      .eq("meal.user_id", viewerId)
      .neq("user_id", viewerId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
  ]);

  const items: ActivityItem[] = [];

  const followerPeople = (newFollowers.data ?? []).flatMap((row) => {
    const person = one<PersonBasics>(row.person);
    return person ? [{ person, at: row.created_at as string }] : [];
  });
  const { iFollow } = await getRelationships(
    supabase,
    viewerId,
    followerPeople.map((f) => f.person.id),
  );
  for (const { person, at } of followerPeople) {
    items.push({ kind: "follow", key: `follow-${person.id}`, at, person, iFollow: iFollow.has(person.id) });
  }

  for (const row of (likesOnMine.data ?? []) as Record<string, unknown>[]) {
    const person = one<PersonBasics>(row.person);
    const meal = one<{ meal: string | null; hall: unknown }>(row.meal);
    if (!person || !meal) continue;
    items.push({
      kind: "like",
      key: `like-${person.id}-${row.meal_id}`,
      at: row.created_at as string,
      person,
      hall: one<{ slug: string; name: string }>(meal.hall),
      meal: meal.meal ?? null,
    });
  }

  for (const row of (commentsOnMine.data ?? []) as Record<string, unknown>[]) {
    const person = one<PersonBasics>(row.person);
    const meal = one<{ meal: string | null; hall: unknown }>(row.meal);
    if (!person || !meal) continue;
    items.push({
      kind: "comment",
      key: `comment-${row.id}`,
      at: row.created_at as string,
      person,
      hall: one<{ slug: string; name: string }>(meal.hall),
      meal: meal.meal ?? null,
      body: row.body as string,
    });
  }

  for (const row of (savesOfMine.data ?? []) as Record<string, unknown>[]) {
    const person = one<PersonBasics>(row.person);
    const meal = one<{ meal: string | null; hall: unknown }>(row.meal);
    if (!person || !meal) continue;
    items.push({
      kind: "save",
      key: `save-${row.id}`,
      at: row.created_at as string,
      person,
      hall: one<{ slug: string; name: string }>(meal.hall),
      meal: meal.meal ?? null,
    });
  }

  return { items: items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_ITEMS), now };
}

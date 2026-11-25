import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sentiment } from "@/features/ranking/types";
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
      kind: "ranking";
      key: string;
      at: string;
      person: PersonBasics;
      dish: { id: number; name: string };
      score: number;
      sentiment: Sentiment | null;
      comment: string | null;
    }
  | {
      kind: "meal";
      key: string;
      at: string;
      person: PersonBasics;
      hall: { slug: string; name: string } | null;
      meal: string | null;
      dishCount: number;
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
 * - dishes rated by people you follow
 * - meals logged by people you follow
 * Built from existing tables (follows, rankings, meals), so no extra
 * "notifications" table is needed.
 */
export async function getActivity(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<{ items: ActivityItem[]; now: number }> {
  // Also returned, so "3h ago" is measured from the same moment.
  const now = Date.now();
  const since = new Date(now - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();

  const [newFollowers, myFollowing] = await Promise.all([
    supabase
      .from("follows")
      .select(`created_at, person:profiles!follows_follower_id_fkey(${PERSON})`)
      .eq("followee_id", viewerId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    supabase.from("follows").select("followee_id").eq("follower_id", viewerId).limit(1000),
  ]);

  const followingIds = (myFollowing.data ?? []).map((row) => row.followee_id as string);

  // What the people you follow have been up to.
  const [rankings, meals] =
    followingIds.length === 0
      ? [{ data: [] }, { data: [] }]
      : await Promise.all([
          // created_at = when the dish went on their list. updated_at also moves
          // whenever another ranking re-spreads scores in the same group, so
          // one new ranking would show up as several.
          supabase
            .from("rankings")
            .select(
              `user_id, score, sentiment, comment, created_at, dish:dishes(id, name), person:profiles!rankings_user_id_fkey(${PERSON})`,
            )
            .in("user_id", followingIds)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(MAX_ITEMS),
          supabase
            .from("meals")
            .select(
              `id, meal, created_at, hall:dining_halls(slug, name), meal_dishes(count), person:profiles!meals_user_id_fkey(${PERSON})`,
            )
            .in("user_id", followingIds)
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

  for (const row of (rankings.data ?? []) as Record<string, unknown>[]) {
    const person = one<PersonBasics>(row.person);
    const dish = one<{ id: number; name: string }>(row.dish);
    if (!person || !dish) continue;
    items.push({
      kind: "ranking",
      key: `ranking-${person.id}-${dish.id}`,
      at: row.created_at as string,
      person,
      dish,
      score: Number(row.score),
      sentiment: (row.sentiment as Sentiment | null) ?? null,
      comment: (row.comment as string | null) ?? null,
    });
  }

  for (const row of (meals.data ?? []) as Record<string, unknown>[]) {
    const person = one<PersonBasics>(row.person);
    if (!person) continue;
    const counted = one<{ count: number }>(row.meal_dishes);
    items.push({
      kind: "meal",
      key: `meal-${row.id}`,
      at: row.created_at as string,
      person,
      hall: one<{ slug: string; name: string }>(row.hall),
      meal: (row.meal as string | null) ?? null,
      dishCount: counted?.count ?? 0,
    });
  }

  return { items: items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_ITEMS), now };
}

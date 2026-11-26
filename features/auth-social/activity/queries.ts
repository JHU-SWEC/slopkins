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
      /** The plate they ranked. */
      hall: { slug: string; name: string } | null;
      meal: string | null;
      /** Where it sits on their ranked plates now (1 = best). */
      rank: number;
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
 * - people who liked or commented on your meals
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

  const [newFollowers, myFollowing, likesOnMine, commentsOnMine] = await Promise.all([
    supabase
      .from("follows")
      .select(`created_at, person:profiles!follows_follower_id_fkey(${PERSON})`)
      .eq("followee_id", viewerId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    supabase.from("follows").select("followee_id").eq("follower_id", viewerId).limit(1000),
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
  ]);

  const followingIds = (myFollowing.data ?? []).map((row) => row.followee_id as string);

  // What the people you follow have been up to.
  const [rankings, meals] =
    followingIds.length === 0
      ? [{ data: [] }, { data: [] }]
      : await Promise.all([
          // Every ranked plate of the people you follow, best first, so each
          // one's spot on their list can be counted; only recent ones become
          // items below. created_at = when the plate went on their list
          // (updated_at also moves whenever another ranking re-spreads scores).
          // Deleted posts drop out (meals RLS).
          supabase
            .from("plate_rankings")
            .select(
              `meal_id, user_id, score, sentiment, comment, created_at, meal:meals!inner(meal, hall:dining_halls(slug, name)), person:profiles!plate_rankings_user_id_fkey(${PERSON})`,
            )
            .in("user_id", followingIds)
            .order("score", { ascending: false })
            .limit(2000),
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

  // Rows come best first, so counting per person gives each plate's rank.
  const placed = new Map<string, number>();
  const recentRankings: ActivityItem[] = [];
  for (const row of (rankings.data ?? []) as Record<string, unknown>[]) {
    const rank = (placed.get(row.user_id as string) ?? 0) + 1;
    placed.set(row.user_id as string, rank);
    const person = one<PersonBasics>(row.person);
    const meal = one<{ meal: string | null; hall: unknown }>(row.meal);
    if (!person || !meal || (row.created_at as string) < since) continue;
    recentRankings.push({
      kind: "ranking",
      key: `ranking-${row.meal_id}`,
      at: row.created_at as string,
      person,
      hall: one<{ slug: string; name: string }>(meal.hall),
      meal: meal.meal,
      rank,
      score: Number(row.score),
      sentiment: (row.sentiment as Sentiment | null) ?? null,
      comment: (row.comment as string | null) ?? null,
    });
  }
  items.push(
    ...recentRankings.sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, MAX_ITEMS),
  );

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

  return { items: items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_ITEMS), now };
}

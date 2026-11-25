import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/features/auth-social/profile/shared";
import type { Sentiment } from "@/features/ranking/types";

type PersonBasics = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

/** One dish in a feed post, with the poster's score if they've ranked it. */
export type FeedDish = {
  id: number;
  name: string;
  ranking: { score: number; sentiment: Sentiment; comment: string | null } | null;
};

/** One logged meal on the feed. `at` is an ISO timestamp. */
export type FeedPost = {
  id: number;
  at: string;
  person: PersonBasics;
  hall: { slug: string; name: string } | null;
  meal: string | null;
  dishes: FeedDish[];
};

const PERSON = "id, username, display_name, avatar_url";
const MAX_POSTS = 30;

// Supabase can return a joined row as an object or a one-item list. Normalize it.
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

/**
 * Meals logged by you and the people you follow, newest first, each with its
 * dishes and the poster's current score for every dish they've ranked.
 */
export async function getFeed(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<{ posts: FeedPost[]; now: number }> {
  // Also returned, so "3h ago" is measured from the same moment.
  const now = Date.now();

  const { data: following } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", viewerId)
    .limit(1000);
  const authorIds = [viewerId, ...(following ?? []).map((row) => row.followee_id as string)];

  const { data: meals } = await supabase
    .from("meals")
    .select(
      `id, user_id, meal, created_at, hall:dining_halls(slug, name), person:profiles!meals_user_id_fkey(${PERSON}), meal_dishes(dish:dishes(id, name))`,
    )
    .in("user_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(MAX_POSTS);
  const rows = (meals ?? []) as Record<string, unknown>[];

  // Scores for every dish in these posts, keyed by "user:dish".
  const dishIds = new Set<number>();
  for (const row of rows) {
    for (const item of (row.meal_dishes as Record<string, unknown>[] | null) ?? []) {
      const dish = one<{ id: number }>(item.dish);
      if (dish) dishIds.add(dish.id);
    }
  }
  const { data: rankings } =
    dishIds.size === 0
      ? { data: [] }
      : await supabase
          .from("rankings")
          .select("user_id, dish_id, score, sentiment, comment")
          .in("user_id", authorIds)
          .in("dish_id", [...dishIds]);
  const scores = new Map<string, FeedDish["ranking"]>();
  for (const r of (rankings ?? []) as Record<string, unknown>[]) {
    scores.set(`${r.user_id}:${r.dish_id}`, {
      score: Number(r.score),
      sentiment: r.sentiment as Sentiment,
      comment: (r.comment as string | null) ?? null,
    });
  }

  const posts: FeedPost[] = [];
  for (const row of rows) {
    const person = one<PersonBasics>(row.person);
    if (!person) continue;
    const dishes = ((row.meal_dishes as Record<string, unknown>[] | null) ?? []).flatMap((item) => {
      const dish = one<{ id: number; name: string }>(item.dish);
      return dish ? [{ ...dish, ranking: scores.get(`${row.user_id}:${dish.id}`) ?? null }] : [];
    });
    // Ranked dishes first, best score first; unranked keep their order after.
    dishes.sort((a, b) => (b.ranking?.score ?? -1) - (a.ranking?.score ?? -1));
    posts.push({
      id: row.id as number,
      at: row.created_at as string,
      person,
      hall: one<{ slug: string; name: string }>(row.hall),
      meal: (row.meal as string | null) ?? null,
      dishes,
    });
  }

  return { posts, now };
}

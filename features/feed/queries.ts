import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/features/auth-social/profile/shared";
import type { Sentiment } from "@/features/ranking/types";

type PersonBasics = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

/** One dish in a feed post. */
export type FeedDish = {
  id: number;
  name: string;
};

/** The poster's ranking of the whole plate. */
export type PlateRanking = {
  score: number;
  sentiment: Sentiment;
  comment: string | null;
  /** 1-based spot on the poster's list of ranked plates. */
  rank: number;
};

/** A comment under a post. `at` is an ISO timestamp. */
export type FeedComment = {
  id: number;
  at: string;
  body: string;
  person: PersonBasics;
  likes: number;
  /** You've liked this comment. */
  likedByMe: boolean;
};

/** One logged meal on the feed. `at` is an ISO timestamp. */
export type FeedPost = {
  id: number;
  at: string;
  person: PersonBasics;
  hall: { slug: string; name: string } | null;
  meal: string | null;
  /** Path in the meal-photos bucket, or null if no photo. */
  photoPath: string | null;
  /** What the poster wrote when logging it, if anything. */
  caption: string | null;
  dishes: FeedDish[];
  /** Null until the poster ranks the plate. */
  ranking: PlateRanking | null;
  likes: number;
  likedByMe: boolean;
  /** How many people saved this plate to Want to Try (not who). */
  saves: number;
  /** Oldest first. */
  comments: FeedComment[];
  /** You've saved this plate to your Want to Try list. */
  savedByMe: boolean;
};

const PERSON = "id, username, display_name, avatar_url";
const MAX_POSTS = 30;

// Supabase can return a joined row as an object or a one-item list. Normalize it.
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

/** What the feed and profile pages need to show a list of posts. */
export type PostList = {
  posts: FeedPost[];
  /** "3h ago" is measured from this moment. */
  now: number;
  /** You, for comments you post before the page reloads. Null if signed out. */
  viewer: PersonBasics | null;
};

/**
 * Meals logged by you and the people you follow, newest first, each with its
 * dishes and the poster's score for the plate if they've ranked it.
 */
export async function getFeed(supabase: SupabaseClient, viewerId: string): Promise<PostList> {
  const { data: following } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", viewerId)
    .limit(1000);
  const authorIds = [viewerId, ...(following ?? []).map((row) => row.followee_id as string)];
  return getPosts(supabase, viewerId, authorIds);
}

/** One person's meals, newest first, for the Posts tab on their profile. */
export function getUserPosts(
  supabase: SupabaseClient,
  viewerId: string | null,
  userId: string,
): Promise<PostList> {
  return getPosts(supabase, viewerId, [userId]);
}

/** Posts by these people, as seen by the viewer (their likes and saves). */
async function getPosts(
  supabase: SupabaseClient,
  viewerId: string | null,
  authorIds: string[],
): Promise<PostList> {
  // Also returned, so "3h ago" is measured from the same moment.
  const now = Date.now();
  const { data: viewer } = viewerId
    ? await supabase.from("profiles").select(PERSON).eq("id", viewerId).maybeSingle()
    : { data: null };

  const { data: meals } = await supabase
    .from("meals")
    .select(
      `id, user_id, meal, photo_path, photo_deleted_at, caption, created_at, hall:dining_halls(slug, name), person:profiles!meals_user_id_fkey(${PERSON}), meal_dishes(dish:dishes(id, name)), meal_likes(count)`,
    )
    .in("user_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(MAX_POSTS);
  const rows = (meals ?? []) as Record<string, unknown>[];

  // Your likes and saves on these posts, and their comments.
  const postIds = rows.map((row) => row.id as number);
  const none = Promise.resolve({ data: [] as Record<string, unknown>[] });
  const [{ data: myLikes }, { data: mySaves }, { data: commentRows }, { data: saveCounts }, { data: plateRows }] =
    postIds.length === 0
      ? [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]
      : await Promise.all([
          viewerId
            ? supabase.from("meal_likes").select("meal_id").eq("user_id", viewerId).in("meal_id", postIds)
            : none,
          viewerId
            ? supabase.from("saved_plates").select("meal_id").eq("user_id", viewerId).in("meal_id", postIds)
            : none,
          supabase
            .from("meal_comments")
            .select(
              `id, meal_id, body, created_at, person:profiles!meal_comments_user_id_fkey(${PERSON}), comment_likes(count)`,
            )
            .in("meal_id", postIds)
            .order("created_at", { ascending: true }),
          // How many people saved each post. (Who saved it shows on their
          // public Want to Try lists, not here.)
          supabase.rpc("meal_save_counts", { p_meal_ids: postIds }),
          // Every ranked plate by these people (not just the posts shown), so
          // each post can say where it sits on its poster's list. Deleted posts
          // drop out (meals RLS). Until the plate_rankings migration is applied
          // this errors and every post shows unranked.
          supabase
            .from("plate_rankings")
            .select("meal_id, user_id, score, sentiment, comment, meal:meals!inner(id)")
            .in("user_id", authorIds)
            .order("score", { ascending: false }),
        ]);
  const saveCount = new Map(
    ((saveCounts ?? []) as { meal_id: number; saves: number }[]).map((row) => [row.meal_id, Number(row.saves)]),
  );
  const liked = new Set((myLikes ?? []).map((row) => row.meal_id as number));
  const saved = new Set((mySaves ?? []).map((row) => row.meal_id as number));
  // Which of these comments you've liked.
  const commentIds = ((commentRows ?? []) as Record<string, unknown>[]).map((row) => row.id as number);
  const { data: myCommentLikes } =
    viewerId && commentIds.length > 0
      ? await supabase.from("comment_likes").select("comment_id").eq("user_id", viewerId).in("comment_id", commentIds)
      : { data: [] };
  const likedComments = new Set((myCommentLikes ?? []).map((row) => row.comment_id as number));

  const comments = new Map<number, FeedComment[]>();
  for (const row of (commentRows ?? []) as Record<string, unknown>[]) {
    const person = one<PersonBasics>(row.person);
    if (!person) continue;
    const list = comments.get(row.meal_id as number) ?? [];
    list.push({
      id: row.id as number,
      at: row.created_at as string,
      body: row.body as string,
      person,
      likes: one<{ count: number }>(row.comment_likes)?.count ?? 0,
      likedByMe: likedComments.has(row.id as number),
    });
    comments.set(row.meal_id as number, list);
  }

  // Rows come best first, so counting per person gives each plate's rank.
  const plates = new Map<number, PlateRanking>();
  const placed = new Map<string, number>();
  for (const r of (plateRows ?? []) as Record<string, unknown>[]) {
    const rank = (placed.get(r.user_id as string) ?? 0) + 1;
    placed.set(r.user_id as string, rank);
    plates.set(r.meal_id as number, {
      score: Number(r.score),
      sentiment: r.sentiment as Sentiment,
      comment: (r.comment as string | null) ?? null,
      rank,
    });
  }

  const posts: FeedPost[] = [];
  for (const row of rows) {
    const person = one<PersonBasics>(row.person);
    if (!person) continue;
    const dishes = ((row.meal_dishes as Record<string, unknown>[] | null) ?? []).flatMap((item) => {
      const dish = one<{ id: number; name: string }>(item.dish);
      return dish ? [dish] : [];
    });
    posts.push({
      id: row.id as number,
      at: row.created_at as string,
      person,
      hall: one<{ slug: string; name: string }>(row.hall),
      meal: (row.meal as string | null) ?? null,
      // A removed photo stays in storage but isn't shown.
      photoPath: row.photo_deleted_at ? null : ((row.photo_path as string | null) ?? null),
      caption: (row.caption as string | null) ?? null,
      dishes,
      ranking: plates.get(row.id as number) ?? null,
      likes: one<{ count: number }>(row.meal_likes)?.count ?? 0,
      likedByMe: liked.has(row.id as number),
      saves: saveCount.get(row.id as number) ?? 0,
      comments: comments.get(row.id as number) ?? [],
      savedByMe: saved.has(row.id as number),
    });
  }

  return { posts, now, viewer: (viewer as PersonBasics | null) ?? null };
}

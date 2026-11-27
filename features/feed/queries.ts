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

const MAX_POSTS = 30;

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
 * dishes and the poster's score for the plate if they've ranked it. One
 * database call: get_feed (see supabase/migrations/*_feed_functions.sql)
 * builds the whole list. The viewer is whoever is signed in on `supabase`.
 */
export async function getFeed(supabase: SupabaseClient): Promise<PostList> {
  return toPostList(await supabase.rpc("get_feed", { p_limit: MAX_POSTS }), "get_feed");
}

/**
 * One person's meals, newest first, for the Posts tab on their profile, as
 * whoever is signed in on `supabase` sees them (their likes and saves).
 */
export async function getUserPosts(supabase: SupabaseClient, userId: string): Promise<PostList> {
  return toPostList(
    await supabase.rpc("get_posts", { p_author_ids: [userId], p_limit: MAX_POSTS }),
    "get_posts",
  );
}

// The functions return { viewer, posts } already shaped like PostList.
function toPostList(
  { data, error }: { data: unknown; error: { message: string } | null },
  name: string,
): PostList {
  // Fail loudly: an empty list would look like "Nothing here yet".
  if (error) throw new Error(`${name} failed: ${error.message}`);
  const result = (data ?? {}) as { posts?: FeedPost[]; viewer?: PersonBasics | null };
  // "3h ago" is measured from this moment.
  return { posts: result.posts ?? [], now: Date.now(), viewer: result.viewer ?? null };
}

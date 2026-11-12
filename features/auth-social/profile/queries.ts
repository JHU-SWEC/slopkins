import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROFILE_COLUMNS,
  type DiningHall,
  type Profile,
  type ProfileData,
  type RankedDish,
} from "./shared";

// Supabase can return a joined row as an object or a one-item list. Normalize it.
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

/** Everything the profile page shows. Returns null if the profile doesn't exist. */
export async function getProfileData(
  supabase: SupabaseClient,
  by: { username: string } | { id: string },
): Promise<ProfileData | null> {
  const query = supabase.from("profiles").select(PROFILE_COLUMNS);
  const { data: profile } = await ("username" in by
    ? query.eq("username", by.username.toLowerCase())
    : query.eq("id", by.id)
  ).maybeSingle<Profile>();

  if (!profile) return null;

  // Everything else only needs the profile id, so ask for it all at once.
  const [rankings, halls, followers, following, rank] = await Promise.all([
    supabase
      .from("rankings")
      .select("dish_id, score, comment, dish:dishes(name)")
      .eq("user_id", profile.id)
      .order("score", { ascending: false }),
    supabase
      .from("user_dining_halls")
      .select("status, hall:dining_halls(id, slug, name)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    // follows: follower_id follows followee_id.
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followee_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    supabase.rpc("profile_rank", { target: profile.id }).maybeSingle<{
      dishes_ranked: number;
      rank: number;
      total_users: number;
    }>(),
  ]);

  const rankedDishes: RankedDish[] = (rankings.data ?? []).flatMap((row) => {
    const dish = one<{ name: string }>(row.dish);
    return dish
      ? [{ dishId: row.dish_id, name: dish.name, score: Number(row.score), comment: row.comment }]
      : [];
  });

  const visited: DiningHall[] = [];
  const wantToGo: DiningHall[] = [];
  for (const row of halls.data ?? []) {
    const hall = one<DiningHall>(row.hall);
    if (hall) (row.status === "visited" ? visited : wantToGo).push(hall);
  }

  return {
    profile,
    rankedDishes,
    visited,
    wantToGo,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    rank: rank.data ? { position: rank.data.rank, totalUsers: rank.data.total_users } : null,
  };
}

/** All dining halls, for the edit page's checklist. */
export async function getDiningHalls(supabase: SupabaseClient): Promise<DiningHall[]> {
  const { data } = await supabase.from("dining_halls").select("id, slug, name").order("name");
  return data ?? [];
}

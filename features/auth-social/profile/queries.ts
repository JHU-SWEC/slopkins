import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BASIC_PROFILE_COLUMNS,
  DETAIL_PROFILE_COLUMNS,
  NO_DETAILS,
  type DiningHall,
  type Profile,
  type ProfileData,
} from "./shared";
import { getRankedDishes } from "@/features/ranking/queries";

// Supabase can return a joined row as an object or a one-item list. Normalize it.
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

type BasicProfile = Omit<Profile, "grade" | "major" | "bio">;

/** The columns every profile has (username, display name, photo, join date). */
export async function getBasicProfile(
  supabase: SupabaseClient,
  by: { username: string } | { id: string },
): Promise<BasicProfile | null> {
  const query = supabase.from("profiles").select(BASIC_PROFILE_COLUMNS);
  const { data } = await ("username" in by
    ? query.eq("username", by.username.toLowerCase())
    : query.eq("id", by.id)
  ).maybeSingle<BasicProfile>();
  return data;
}

/**
 * Grade, major, and bio. These columns only exist once the profile-page
 * migration is applied; until then this returns ready: false instead of failing.
 */
export async function getProfileDetails(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(DETAIL_PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle<Pick<Profile, "grade" | "major" | "bio">>();
  return { ready: !error, details: data ?? NO_DETAILS };
}

/** Everything the profile page shows. Returns null if the profile doesn't exist. */
export async function getProfileData(
  supabase: SupabaseClient,
  by: { username: string } | { id: string },
): Promise<ProfileData | null> {
  const basic = await getBasicProfile(supabase, by);
  if (!basic) return null;

  // Everything else only needs the profile id, so ask for it all at once.
  // Parts that need the migration (details, dining halls, rank) just come back
  // empty until it's applied.
  const [details, rankedDishes, halls, followers, following, rank] = await Promise.all([
    getProfileDetails(supabase, basic.id),
    getRankedDishes(supabase, basic.id),
    supabase
      .from("user_dining_halls")
      .select("status, hall:dining_halls(id, slug, name)")
      .eq("user_id", basic.id)
      .order("created_at", { ascending: false }),
    // follows: follower_id follows followee_id.
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followee_id", basic.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", basic.id),
    supabase.rpc("profile_rank", { target: basic.id }).maybeSingle<{
      dishes_ranked: number;
      rank: number;
      total_users: number;
    }>(),
  ]);

  const visited: DiningHall[] = [];
  const wantToGo: DiningHall[] = [];
  for (const row of halls.data ?? []) {
    const hall = one<DiningHall>(row.hall);
    if (hall) (row.status === "visited" ? visited : wantToGo).push(hall);
  }

  return {
    profile: { ...basic, ...details.details },
    detailsReady: details.ready,
    rankedDishes,
    visited,
    wantToGo,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    // No rank until you've ranked a dish (otherwise everyone ties for #1 at 0).
    rank:
      rank.data && rank.data.dishes_ranked > 0
        ? { position: rank.data.rank, totalUsers: rank.data.total_users }
        : null,
  };
}

/** All dining halls, for the edit page's checklist. */
export async function getDiningHalls(supabase: SupabaseClient): Promise<DiningHall[]> {
  const { data } = await supabase.from("dining_halls").select("id, slug, name").order("name");
  return data ?? [];
}

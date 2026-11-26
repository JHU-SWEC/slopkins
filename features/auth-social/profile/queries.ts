import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BASIC_PROFILE_COLUMNS,
  DETAIL_PROFILE_COLUMNS,
  NO_DETAILS,
  type Profile,
  type ProfileData,
} from "./shared";
import { getSavedPlates, getWantToTry } from "@/features/ranking/queries";

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
  // Parts that need the migration (details, rank) just come back
  // empty until it's applied.
  const [details, wantToTry, savedPlates, followers, following, rank] = await Promise.all([
    getProfileDetails(supabase, basic.id),
    getWantToTry(supabase, basic.id),
    getSavedPlates(supabase, basic.id),
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

  return {
    profile: { ...basic, ...details.details },
    detailsReady: details.ready,
    wantToTry,
    savedPlates,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    // No rank until you've ranked a plate (otherwise everyone ties for #1 at 0).
    rank:
      rank.data && rank.data.dishes_ranked > 0
        ? { position: rank.data.rank }
        : null,
  };
}

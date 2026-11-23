import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../profile/shared";

/** A person in a list (followers, following, search results). */
export type Person = Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> & {
  /** You (the viewer) follow them. */
  iFollow: boolean;
  /** They follow you. */
  followsMe: boolean;
};

type PersonBasics = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

const PERSON_COLUMNS = "id, username, display_name, avatar_url";
const LIST_LIMIT = 200;

// Supabase can return a joined row as an object or a one-item list. Normalize it.
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

/**
 * For each of `ids`, whether the viewer follows them and whether they follow
 * the viewer. Two small queries, no matter how many people are in the list.
 */
export async function getRelationships(
  supabase: SupabaseClient,
  viewerId: string | null,
  ids: string[],
) {
  const iFollow = new Set<string>();
  const followsMe = new Set<string>();
  if (!viewerId || ids.length === 0) return { iFollow, followsMe };

  const [mine, theirs] = await Promise.all([
    supabase.from("follows").select("followee_id").eq("follower_id", viewerId).in("followee_id", ids),
    supabase.from("follows").select("follower_id").eq("followee_id", viewerId).in("follower_id", ids),
  ]);
  for (const row of mine.data ?? []) iFollow.add(row.followee_id);
  for (const row of theirs.data ?? []) followsMe.add(row.follower_id);
  return { iFollow, followsMe };
}

async function withRelationships(
  supabase: SupabaseClient,
  viewerId: string | null,
  people: PersonBasics[],
): Promise<Person[]> {
  const { iFollow, followsMe } = await getRelationships(
    supabase,
    viewerId,
    people.map((p) => p.id),
  );
  return people.map((p) => ({ ...p, iFollow: iFollow.has(p.id), followsMe: followsMe.has(p.id) }));
}

/** Who follows `profileId` (followers) or who `profileId` follows (following). Newest first. */
export async function getFollowList(
  supabase: SupabaseClient,
  profileId: string,
  kind: "followers" | "following",
  viewerId: string | null,
): Promise<Person[]> {
  // followers: rows where they're followed; join to the follower's profile.
  // following: rows where they're the follower; join to the followee's profile.
  const { data } =
    kind === "followers"
      ? await supabase
          .from("follows")
          .select(`person:profiles!follows_follower_id_fkey(${PERSON_COLUMNS})`)
          .eq("followee_id", profileId)
          .order("created_at", { ascending: false })
          .limit(LIST_LIMIT)
      : await supabase
          .from("follows")
          .select(`person:profiles!follows_followee_id_fkey(${PERSON_COLUMNS})`)
          .eq("follower_id", profileId)
          .order("created_at", { ascending: false })
          .limit(LIST_LIMIT);

  const people = (data ?? []).flatMap((row) => {
    const person = one<PersonBasics>(row.person);
    return person ? [person] : [];
  });
  return withRelationships(supabase, viewerId, people);
}

/** Follower and following counts for one profile. */
export async function getFollowCounts(supabase: SupabaseClient, profileId: string) {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", profileId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

/**
 * Find people by username or display name. Usernames that start with what you
 * typed come first, like on Instagram.
 */
export async function searchProfiles(
  supabase: SupabaseClient,
  query: string,
  viewerId: string | null,
): Promise<Person[]> {
  // Drop "@" and any characters that have special meaning in the search filter.
  const term = query.trim().replace(/^@/, "").replace(/[^\p{L}\p{N} _'-]/gu, "").slice(0, 50);
  if (!term) return [];

  const { data } = await supabase
    .from("profiles")
    .select(PERSON_COLUMNS)
    .or(`username.ilike.*${term}*,display_name.ilike.*${term}*`)
    .order("username")
    .limit(25);

  const lower = term.toLowerCase();
  const score = (p: PersonBasics) =>
    p.username === lower ? 0 : p.username.startsWith(lower) ? 1 : p.display_name?.toLowerCase().startsWith(lower) ? 2 : 3;
  const people = ((data ?? []) as PersonBasics[]).sort((a, b) => score(a) - score(b));
  return withRelationships(supabase, viewerId, people);
}

/** The newest members, shown on the search page before you type anything. */
export async function getNewestProfiles(
  supabase: SupabaseClient,
  viewerId: string | null,
): Promise<Person[]> {
  let query = supabase
    .from("profiles")
    .select(PERSON_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(10);
  if (viewerId) query = query.neq("id", viewerId);
  const { data } = await query;
  return withRelationships(supabase, viewerId, (data ?? []) as PersonBasics[]);
}

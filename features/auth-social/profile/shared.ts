// Used by both server code and browser code, so nothing server-only here.
import type { RankedDish, SavedPlate, WantToTryItem } from "@/features/ranking/types";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Pick<
  Tables<"profiles">,
  "id" | "username" | "display_name" | "avatar_url" | "grade" | "major" | "bio" | "created_at"
>;

export type ProfileData = {
  profile: Profile;
  /** False until the profile-page migration adds grade/major/bio. */
  detailsReady: boolean;
  rankedDishes: RankedDish[];
  /** Only filled for the profile's owner (dish_alerts is private). */
  wantToTry: WantToTryItem[];
  /** Plates saved from other people's posts. Empty unless it's your profile. */
  savedPlates: SavedPlate[];
  /** When this was loaded (ms), so "2h" times are measured from one moment. */
  loadedAt: number;
  followers: number;
  following: number;
  rank: { position: number; totalUsers: number } | null;
};

// Columns from the team's initial schema: always there.
export const BASIC_PROFILE_COLUMNS = "id, username, display_name, avatar_url, created_at";
// Columns added by supabase/migrations/20261111190000_profile_page.sql.
export const DETAIL_PROFILE_COLUMNS = "grade, major, bio";

export const NO_DETAILS = { grade: null, major: null, bio: null } as const;

/** New accounts get a placeholder like "user_5acf5a3af2f7" until they pick one. */
export function isPlaceholderUsername(username: string) {
  return /^user_[0-9a-f]{12}$/.test(username);
}

/** "Amy.Yang7@gmail.com" -> "amyyang7". Empty if nothing usable is left. */
export function suggestUsername(email: string | undefined) {
  const base = (email ?? "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  return base.length >= 3 ? base : "";
}

export const GRADES = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "Other"] as const;

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const DISPLAY_NAME_LIMIT = 50;
export const MAJOR_LIMIT = 80;
export const BIO_LIMIT = 300;

// profiles.avatar_url stores a path in the "avatars" bucket, like "<user id>/123.png".
export function avatarSrc(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

/** The name to show big: display name if set, otherwise @username. */
export function shownName(profile: Pick<Profile, "display_name" | "username">) {
  return profile.display_name?.trim() || `@${profile.username}`;
}

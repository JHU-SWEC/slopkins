// Used by both server code and browser code, so nothing server-only here.
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Pick<
  Tables<"profiles">,
  "id" | "username" | "display_name" | "avatar_url" | "grade" | "major" | "bio" | "created_at"
>;

export type DiningHall = Pick<Tables<"dining_halls">, "id" | "slug" | "name">;

export type RankedDish = {
  dishId: number;
  name: string;
  score: number;
  comment: string | null;
};

export type ProfileData = {
  profile: Profile;
  rankedDishes: RankedDish[];
  visited: DiningHall[];
  wantToGo: DiningHall[];
  followers: number;
  following: number;
  rank: { position: number; totalUsers: number } | null;
};

export const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, grade, major, bio, created_at";

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

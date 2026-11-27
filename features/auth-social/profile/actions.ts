"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import {
  BIO_LIMIT,
  DISPLAY_NAME_LIMIT,
  GRADES,
  MAJOR_LIMIT,
  USERNAME_CHOSEN_COOKIE,
  USERNAME_CHOSEN_COOKIE_OPTIONS,
  USERNAME_PATTERN,
  isPlaceholderUsername,
} from "./shared";
import { nameProblem } from "./name-rules";

export type EditProfileState = { error?: string };

export async function updateProfile(
  _prevState: EditProfileState,
  formData: FormData,
): Promise<EditProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) redirect("/login");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "");
  const major = String(formData.get("major") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarPath = String(formData.get("avatar_path") ?? "").trim();

  // Check everything before saving, with messages a person can act on.
  const nameError = checkNames(username, displayName);
  if (nameError) return { error: nameError };
  if (grade && !(GRADES as readonly string[]).includes(grade)) {
    return { error: "Pick a grade from the list." };
  }
  if (major.length > MAJOR_LIMIT) return { error: `Major must be ${MAJOR_LIMIT} characters or fewer.` };
  if (bio.length > BIO_LIMIT) return { error: `Bio must be ${BIO_LIMIT} characters or fewer.` };

  // Only accept photos uploaded into this user's own folder: "<user id>/<file>".
  const ownPhoto = new RegExp(`^${user.id}/[A-Za-z0-9._-]+$`);
  if (avatarPath && !ownPhoto.test(avatarPath)) {
    return { error: "That profile picture couldn't be used. Try uploading it again." };
  }

  // The basics: photo, name, username. These columns always exist.
  const { error } = await supabase
    .from("profiles")
    .update({ username, display_name: displayName, avatar_url: avatarPath || null })
    .eq("id", user.id);

  if (error) return { error: saveError(error.code, username, "your profile") };

  // The form only shows (and sends) the rest once the profile-page migration is applied.
  if (formData.get("details_ready") !== "1") redirect("/profile");

  const details = await supabase
    .from("profiles")
    .update({ grade: grade || null, major: major || null, bio: bio || null })
    .eq("id", user.id);
  if (details.error) return { error: "Saved your name and photo, but couldn't save the rest." };

  redirect("/profile");
}

/**
 * /welcome: a new account picks its username (and optionally a display name)
 * before using the app. Then on to the feed.
 */
export async function chooseUsername(
  _prevState: EditProfileState,
  formData: FormData,
): Promise<EditProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) redirect("/login");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const nameError = checkNames(username, displayName);
  if (nameError) return { error: nameError };

  const { error } = await supabase
    .from("profiles")
    .update({ username, display_name: displayName })
    .eq("id", user.id);
  if (error) return { error: saveError(error.code, username, "your username") };

  // Tell the proxy they're set, so it doesn't look up the username again.
  (await cookies()).set(USERNAME_CHOSEN_COOKIE, user.id, USERNAME_CHOSEN_COOKIE_OPTIONS);
  redirect("/feed");
}

// Rules for usernames and display names, with messages a person can act on.
function checkNames(username: string, displayName: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return "Usernames are 3–20 characters: lowercase letters, numbers, and _ only.";
  }
  // Looks like the automatic "user_5acf5a3af2f7" names, which mean "not picked yet".
  if (isPlaceholderUsername(username)) return "Pick a username of your own.";
  if (!displayName) return "Add a display name.";
  // No slurs, derogatory terms, or official-sounding names (see name-rules.ts).
  const problem = nameProblem(username, "username") ?? nameProblem(displayName, "display name");
  if (problem) return problem;
  if (displayName.length > DISPLAY_NAME_LIMIT) {
    return `Name must be ${DISPLAY_NAME_LIMIT} characters or fewer.`;
  }
  return null;
}

function saveError(code: string | undefined, username: string, what: string) {
  return code === "23505" // Postgres code for "already exists"
    ? `@${username} is taken. Try another username.`
    : `Couldn't save ${what}. Please try again.`;
}

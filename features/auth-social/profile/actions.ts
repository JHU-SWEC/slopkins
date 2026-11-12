"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BIO_LIMIT,
  DISPLAY_NAME_LIMIT,
  GRADES,
  MAJOR_LIMIT,
  USERNAME_PATTERN,
} from "./shared";

export type EditProfileState = { error?: string };

function hallIds(values: FormDataEntryValue[]) {
  return [...new Set(values.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
}

export async function updateProfile(
  _prevState: EditProfileState,
  formData: FormData,
): Promise<EditProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "");
  const major = String(formData.get("major") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarPath = String(formData.get("avatar_path") ?? "").trim();

  // Check everything before saving, with messages a person can act on.
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Usernames are 3–20 characters: lowercase letters, numbers, and _ only." };
  }
  if (displayName.length > DISPLAY_NAME_LIMIT) {
    return { error: `Name must be ${DISPLAY_NAME_LIMIT} characters or fewer.` };
  }
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

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      grade: grade || null,
      major: major || null,
      bio: bio || null,
      avatar_url: avatarPath || null,
    })
    .eq("id", user.id);

  if (error) {
    return {
      error:
        error.code === "23505" // Postgres code for "already exists"
          ? `@${username} is taken. Try another username.`
          : "Couldn't save your profile. Please try again.",
    };
  }

  // Replace the user's "been to" / "want to go" lists with what's checked now.
  const rows = [
    ...hallIds(formData.getAll("visited")).map((dining_hall_id) => ({
      user_id: user.id,
      dining_hall_id,
      status: "visited",
    })),
    ...hallIds(formData.getAll("want_to_go")).map((dining_hall_id) => ({
      user_id: user.id,
      dining_hall_id,
      status: "want_to_go",
    })),
  ];
  const cleared = await supabase.from("user_dining_halls").delete().eq("user_id", user.id);
  if (cleared.error) return { error: "Saved your profile, but couldn't update your dining halls." };
  if (rows.length > 0) {
    const inserted = await supabase.from("user_dining_halls").insert(rows);
    if (inserted.error) return { error: "Saved your profile, but couldn't update your dining halls." };
  }

  redirect("/profile");
}

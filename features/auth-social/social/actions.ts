"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FollowResult = { error?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Follow (follow = true) or unfollow (follow = false) another user. */
export async function setFollowing(targetId: string, follow: boolean): Promise<FollowResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in to follow people." };
  if (!UUID.test(targetId)) return { error: "That account couldn't be found." };
  if (targetId === user.id) return { error: "You can't follow yourself." };

  // follows rows mean "follower_id follows followee_id". The database only lets
  // you add or remove rows where you are the follower.
  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: user.id, followee_id: targetId })
    : await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", targetId);

  // 23505 = "already exists": you already follow them, which is what we wanted.
  if (error && error.code !== "23505") {
    return { error: follow ? "Couldn't follow. Please try again." : "Couldn't unfollow. Please try again." };
  }

  // Re-render the page so follower counts and lists show the change.
  refresh();
  return {};
}

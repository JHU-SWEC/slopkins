"use server";

// Feed post actions: likes, comments, saving plates, and soft deletes for your
// own posts. Soft deletes remove nothing: the database functions set a
// timestamp and the app hides the post, photo, or comment.
import { refresh } from "next/cache";
import { createClient, getSignedInUser } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

/** Same limit as the database column (meals.caption). */
const MAX_NOTES = 500;

function isId(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

/** Hides the whole post. Rankings made from it stay on your list. */
export async function deletePostAction(mealId: number): Promise<ActionResult> {
  if (!isId(mealId)) return { error: "That post couldn't be found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_meal", { p_meal_id: mealId });
  if (error) {
    console.error("[feed] soft_delete_meal failed", error);
    return { error: "Couldn't delete this post. Please try again." };
  }
  refresh();
  return {};
}

/**
 * Saves the Edit post popup: new notes (blank removes them) and, if asked,
 * hides the photo. Only what changed is sent.
 */
export async function editPostAction(
  mealId: number,
  changes: { notes?: string; removePhoto?: boolean },
): Promise<ActionResult> {
  if (!isId(mealId)) return { error: "That post couldn't be found." };
  const { notes, removePhoto } = changes ?? {};
  if (notes !== undefined && (typeof notes !== "string" || notes.length > MAX_NOTES)) {
    return { error: `Notes must be ${MAX_NOTES} characters or fewer.` };
  }

  const supabase = await createClient();
  if (notes !== undefined) {
    const { error } = await supabase.rpc("set_meal_caption", { p_meal_id: mealId, p_caption: notes });
    if (error) {
      console.error("[feed] set_meal_caption failed", error);
      return { error: "Couldn't save your notes. Please try again." };
    }
  }
  if (removePhoto === true) {
    const { error } = await supabase.rpc("remove_meal_photo", { p_meal_id: mealId });
    if (error) {
      console.error("[feed] remove_meal_photo failed", error);
      refresh(); // the notes may have saved; show them
      return { error: "Couldn't remove the photo. Please try again." };
    }
  }
  refresh();
  return {};
}

/** Like (liked = true) or unlike a post. You can like your own. */
export async function setLiked(mealId: number, liked: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) return { error: "Log in to like posts." };
  if (!isId(mealId)) return { error: "That post couldn't be found." };

  const { error } = liked
    ? await supabase.from("meal_likes").insert({ user_id: user.id, meal_id: mealId })
    : await supabase.from("meal_likes").delete().eq("user_id", user.id).eq("meal_id", mealId);

  // 23505 = "already exists": you already liked it, which is what we wanted.
  if (error && error.code !== "23505") {
    console.error("[feed] like failed", error);
    return { error: liked ? "Couldn't like this post." : "Couldn't unlike this post." };
  }
  refresh();
  return {};
}

/** Like (liked = true) or unlike a comment under a post. */
export async function setCommentLiked(commentId: number, liked: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) return { error: "Log in to like comments." };
  if (!isId(commentId)) return { error: "That comment couldn't be found." };

  const { error } = liked
    ? await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId })
    : await supabase.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", commentId);

  // 23505 = "already exists": you already liked it, which is what we wanted.
  if (error && error.code !== "23505") {
    console.error("[feed] comment like failed", error);
    return { error: liked ? "Couldn't like that comment." : "Couldn't unlike that comment." };
  }
  refresh();
  return {};
}

const MAX_COMMENT = 500;

/** Adds a comment to a post. */
export async function addComment(mealId: number, body: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) return { error: "Log in to comment." };
  if (!isId(mealId)) return { error: "That post couldn't be found." };
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) return { error: "Write something first." };
  if (text.length > MAX_COMMENT) return { error: `Comments can be up to ${MAX_COMMENT} characters.` };

  const { error } = await supabase.from("meal_comments").insert({ meal_id: mealId, user_id: user.id, body: text });
  if (error) {
    console.error("[feed] comment failed", error);
    return { error: "Couldn't post your comment. Please try again." };
  }
  refresh();
  return {};
}

/** Hides a comment. Works for its author and for the post's owner. */
export async function deleteComment(commentId: number): Promise<ActionResult> {
  if (!isId(commentId)) return { error: "That comment couldn't be found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("soft_delete_comment", { p_comment_id: commentId });
  if (error) {
    console.error("[feed] soft_delete_comment failed", error);
    return { error: "Couldn't delete this comment." };
  }
  refresh();
  return {};
}

/**
 * Saves someone else's plate (the whole combination of dishes) to your Want to
 * Try list as one entry, or removes it (save = false).
 */
export async function setPlateSaved(mealId: number, save: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) return { error: "Log in to save plates." };
  if (!isId(mealId)) return { error: "That post couldn't be found." };

  if (!save) {
    const { error } = await supabase.from("saved_plates").delete().eq("user_id", user.id).eq("meal_id", mealId);
    if (error) return { error: "Couldn't remove that. Please try again." };
    refresh();
    return {};
  }

  const { data: meal } = await supabase
    .from("meals")
    .select("user_id, dining_hall_id, meal, meal_dishes(dish_id)")
    .eq("id", mealId)
    .maybeSingle();
  if (!meal) return { error: "That post couldn't be found." };
  if (meal.user_id === user.id) return { error: "This is your own plate." };
  const dishIds = (meal.meal_dishes ?? []).map((row) => row.dish_id);
  if (dishIds.length === 0) return { error: "This plate has no dishes to save." };

  const { error } = await supabase.from("saved_plates").insert({
    user_id: user.id,
    meal_id: mealId,
    dining_hall_id: meal.dining_hall_id,
    meal: meal.meal,
    dish_ids: dishIds,
  });
  // 23505 = already saved, which is what we wanted.
  if (error && error.code !== "23505") {
    console.error("[feed] saving plate failed", error);
    return { error: "Couldn't save that. Please try again." };
  }
  refresh();
  return {};
}

/** Removes a saved plate by its own id (works even if the original post is gone). */
export async function removeSavedPlate(plateId: number): Promise<ActionResult> {
  if (!isId(plateId)) return { error: "Couldn't remove that." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) return { error: "Log in to change your list." };
  const { error } = await supabase.from("saved_plates").delete().eq("user_id", user.id).eq("id", plateId);
  if (error) return { error: "Couldn't remove that. Please try again." };
  refresh();
  return {};
}

"use server";

// Soft deletes for your own feed posts. Nothing is removed: the database
// functions set a timestamp and the app hides the post or photo.
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

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

/** Hides the post's photo; the post stays. */
export async function removePhotoAction(mealId: number): Promise<ActionResult> {
  if (!isId(mealId)) return { error: "That post couldn't be found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_meal_photo", { p_meal_id: mealId });
  if (error) {
    console.error("[feed] remove_meal_photo failed", error);
    return { error: "Couldn't remove this photo. Please try again." };
  }
  refresh();
  return {};
}

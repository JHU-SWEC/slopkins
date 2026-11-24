"use server";

import { cookies } from "next/headers";
import { ACTIVITY_SEEN_COOKIE } from "./shared";

/**
 * Remember when you last opened Activity, so the next visit can highlight
 * what's new. Stored in a cookie on your browser; no database change needed.
 */
export async function markActivitySeen() {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVITY_SEEN_COOKIE, new Date().toISOString(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400, // 400 days, the longest browsers allow
  });
}

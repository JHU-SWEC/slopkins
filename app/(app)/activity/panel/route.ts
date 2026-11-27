import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getActivity } from "@/features/auth-social/activity/queries";
import { ACTIVITY_SEEN_COOKIE } from "@/features/auth-social/activity/shared";
import { createClient, getSignedInUser } from "@/lib/supabase/server";

// GET /activity/panel: the notifications for the laptop slide-out panel
// (phones open the full /activity page). Like opening that page, it also
// marks them seen. Done here rather than in a server action because setting a
// cookie from an action reloads the page sitting under the panel.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) return NextResponse.json({ signedIn: false });

  const [{ items, now }, cookieStore] = await Promise.all([getActivity(supabase, user.id), cookies()]);
  // Read before it's overwritten, so this visit still highlights what's new.
  const lastSeen = cookieStore.get(ACTIVITY_SEEN_COOKIE)?.value ?? null;

  const response = NextResponse.json(
    { signedIn: true, items, now, lastSeen },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set(ACTIVITY_SEEN_COOKIE, new Date().toISOString(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400, // 400 days, the longest browsers allow
  });
  return response;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  USERNAME_CHOSEN_COOKIE,
  USERNAME_CHOSEN_COOKIE_OPTIONS,
  isPlaceholderUsername,
} from "@/features/auth-social/profile/shared";

// Refreshes the Supabase auth session on each request (only calls Supabase
// when the token is about to expire).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase isn't configured yet: nothing to refresh.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Don't put code between createServerClient and getClaims(). It refreshes
  // an expiring session (setAll writes the new cookies) and checks the token
  // locally against Supabase's public key, instead of a call per request.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  // Signed in but still on the placeholder username: send them to /welcome
  // to pick one before they use the app.
  if (userId && needsUsernameCheck(request, userId)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    if (profile && isPlaceholderUsername(profile.username)) {
      const redirect = NextResponse.redirect(new URL("/welcome", request.url));
      // Keep any refreshed login cookies.
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
    // Picked one (or no profile yet): remember it so later requests skip the query.
    if (profile) {
      response.cookies.set(USERNAME_CHOSEN_COOKIE, userId, USERNAME_CHOSEN_COOKIE_OPTIONS);
    }
  }

  return response;
}

// Pages that stay open without a username: sign-in, the Google return trip,
// and /welcome itself.
const OPEN_WITHOUT_USERNAME = /^\/(?:$|login(?:\/|$)|auth\/|welcome(?:\/|$))/;

function needsUsernameCheck(request: NextRequest, userId: string) {
  // Only page loads; form posts and fetches are left alone.
  if (request.method !== "GET") return false;
  if (OPEN_WITHOUT_USERNAME.test(request.nextUrl.pathname)) return false;
  // The cookie holds the id of whoever picked a username in this browser, so
  // switching accounts checks again.
  return request.cookies.get(USERNAME_CHOSEN_COOKIE)?.value !== userId;
}

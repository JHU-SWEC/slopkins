import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Step 2 of "Continue with Google": Google sends the user back here with a
// one-time `code`. Supabase trades it for a session (the login cookie),
// then we send the user to the feed. Any problem goes to /auth/error.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/feed", origin));
    }
  }

  // No code means the user hit Cancel on Google's screen, or something failed.
  return NextResponse.redirect(new URL("/auth/error", origin));
}

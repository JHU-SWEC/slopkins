"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// What the sign-in button shows if something goes wrong before reaching Google.
export type SignInState = { error?: string };

// Step 1 of "Continue with Google": ask Supabase for a Google sign-in link,
// then send the browser there. Google sends the user back to /auth/callback.
export async function signInWithGoogle(): Promise<SignInState> {
  // signInWithOAuth only builds a link; it doesn't check that Google is turned on.
  // Ask Supabase first, so people see a clear message instead of a raw error page.
  if (!(await isGoogleEnabled())) {
    return { error: "Google sign-in isn't turned on in Supabase yet." };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `http://${requestHeaders.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    return { error: "Couldn't reach Google. Please try again." };
  }

  redirect(data.url);
}

async function isGoogleEnabled() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    });
    const settings = (await response.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return true; // If the check itself fails, let Google sign-in try anyway.
  }
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

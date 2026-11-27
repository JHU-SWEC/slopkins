import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getBasicProfile } from "@/features/auth-social/profile/queries";
import { isPlaceholderUsername, suggestUsername } from "@/features/auth-social/profile/shared";
import { WelcomeForm } from "@/features/auth-social/profile/welcome-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pick a username · Slopkins" };

// /welcome — new accounts pick a username here before using the app.
// proxy.ts sends anyone still on the automatic "user_…" name here.
export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center bg-white text-gray-900">
      <main className="mx-auto w-full max-w-sm px-4 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-heritage-blue">Welcome to Slopkins</h1>
        <div className="mt-8">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-gray-100" />}>
            <Welcome />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Welcome() {
  // Wait for the real request: the sign-in check reads cookies.
  await connection();
  const supabase = await createClient();
  // getUser, not getSignedInUser: the suggestions need the Google email and name.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getBasicProfile(supabase, { id: user.id });
  // Already picked one (e.g. pressed Back after saving).
  if (profile && !isPlaceholderUsername(profile.username)) redirect("/feed");

  // Starting values from the Google account. Nothing is saved until Continue.
  const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return (
    <WelcomeForm
      suggested={{
        username: suggestUsername(user.email),
        displayName: profile?.display_name ?? (typeof googleName === "string" ? googleName : ""),
      }}
    />
  );
}

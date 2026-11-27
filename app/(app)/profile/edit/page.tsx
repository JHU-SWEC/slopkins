import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getBasicProfile,
  getProfileDetails,
} from "@/features/auth-social/profile/queries";
import { EditProfileForm } from "@/features/auth-social/profile/edit-profile-form";
import { ProfileMessage } from "@/features/auth-social/profile/profile-shell";
import { isPlaceholderUsername, suggestUsername } from "@/features/auth-social/profile/shared";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Edit profile · Slopkins" };

// /profile/edit — change your photo, name, username, grade, major, and bio.
export default function EditProfilePage() {
  return (
    <>
      <Link
        href="/profile"
        className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
      >
        ‹ Back to profile
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold tracking-tight text-heritage-blue dark:text-white">Edit profile</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-gray-100" />}>
        <EditProfile />
      </Suspense>
    </>
  );
}

async function EditProfile() {
  // Wait for the real request: the sign-in check reads the clock, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [basic, details] = await Promise.all([
    getBasicProfile(supabase, { id: user.id }),
    getProfileDetails(supabase, user.id),
  ]);

  if (!basic) {
    return (
      <ProfileMessage
        title="Your profile isn't ready yet"
        body="Try refreshing in a moment."
        linkHref="/feed"
        linkLabel="Go to feed"
      />
    );
  }

  // Starting values from the Google account, used only where the profile is still blank.
  // Nothing is saved until the user presses Save.
  const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const suggested = {
    displayName: basic.display_name ? null : typeof googleName === "string" ? googleName : null,
    username: isPlaceholderUsername(basic.username) ? suggestUsername(user.email) || null : null,
  };

  const profile = { ...basic, ...details.details };
  return (
    <EditProfileForm
      // Next.js keeps this page alive when you leave it, and a saved form
      // resets its boxes to their starting values. Keying on what's saved
      // rebuilds the form whenever the profile changed, so it always opens
      // with your latest bio, name, grade, and so on.
      key={JSON.stringify([
        profile.username,
        profile.display_name,
        profile.avatar_url,
        profile.grade,
        profile.major,
        profile.bio,
      ])}
      profile={profile}
      detailsReady={details.ready}
      suggested={suggested}
    />
  );
}

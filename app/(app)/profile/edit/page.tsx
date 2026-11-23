import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getBasicProfile,
  getDiningHalls,
  getProfileDetails,
} from "@/features/auth-social/profile/queries";
import { EditProfileForm } from "@/features/auth-social/profile/edit-profile-form";
import { ProfileMessage } from "@/features/auth-social/profile/profile-shell";
import { isPlaceholderUsername, suggestUsername } from "@/features/auth-social/profile/shared";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Edit profile · Slopkins" };

// /profile/edit — change your photo, name, username, grade, major, bio, and dining halls.
export default function EditProfilePage() {
  return (
    <>
      <Link
        href="/profile"
        className="text-sm font-semibold text-heritage-blue underline-offset-2 hover:underline"
      >
        ‹ Back to profile
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold tracking-tight text-heritage-blue">Edit profile</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-slate-100" />}>
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

  const [basic, details, halls, { data: myHalls }] = await Promise.all([
    getBasicProfile(supabase, { id: user.id }),
    getProfileDetails(supabase, user.id),
    getDiningHalls(supabase),
    supabase.from("user_dining_halls").select("dining_hall_id, status").eq("user_id", user.id),
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

  const idsWith = (status: string) =>
    (myHalls ?? []).filter((row) => row.status === status).map((row) => row.dining_hall_id as number);

  // Starting values from the Google account, used only where the profile is still blank.
  // Nothing is saved until the user presses Save.
  const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const suggested = {
    displayName: basic.display_name ? null : typeof googleName === "string" ? googleName : null,
    username: isPlaceholderUsername(basic.username) ? suggestUsername(user.email) || null : null,
  };

  return (
    <EditProfileForm
      profile={{ ...basic, ...details.details }}
      detailsReady={details.ready}
      suggested={suggested}
      halls={halls}
      visitedIds={idsWith("visited")}
      wantToGoIds={idsWith("want_to_go")}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getDiningHalls } from "@/features/auth-social/profile/queries";
import { EditProfileForm } from "@/features/auth-social/profile/edit-profile-form";
import { ProfileMessage } from "@/features/auth-social/profile/profile-shell";
import { PROFILE_COLUMNS, type Profile } from "@/features/auth-social/profile/shared";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, halls, { data: myHalls }] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle<Profile>(),
    getDiningHalls(supabase),
    supabase.from("user_dining_halls").select("dining_hall_id, status").eq("user_id", user.id),
  ]);

  if (!profile) {
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

  return (
    <EditProfileForm
      profile={profile}
      halls={halls}
      visitedIds={idsWith("visited")}
      wantToGoIds={idsWith("want_to_go")}
    />
  );
}

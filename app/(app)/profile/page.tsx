import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfileData } from "@/features/auth-social/profile/queries";
import { ProfileView } from "@/features/auth-social/profile/profile-view";
import { ProfileMessage, ProfileSkeleton } from "@/features/auth-social/profile/profile-shell";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Your profile · Slopkins" };

// /profile — your own profile. Sends you to log in if you aren't.
export default function MyProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <MyProfile />
    </Suspense>
  );
}

async function MyProfile() {
  // Wait for the real request: the sign-in check reads the clock, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getProfileData(supabase, { id: user.id });
  if (!data) {
    return (
      <ProfileMessage
        title="Your profile isn't ready yet"
        body="Your account exists, but its profile couldn't be loaded. Try refreshing in a moment."
        linkHref="/feed"
        linkLabel="Go to feed"
      />
    );
  }

  return <ProfileView data={data} isOwner />;
}

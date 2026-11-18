import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfileData } from "@/features/auth-social/profile/queries";
import { ProfileView } from "@/features/auth-social/profile/profile-view";
import { ProfileMessage, ProfileSkeleton } from "@/features/auth-social/profile/profile-shell";

export const metadata: Metadata = { title: "Profile · Slopkins" };

// /u/<username> — anyone's profile. This is the link the Share button gives out.
export default function UserProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      {params.then(({ username }) => (
        <UserProfile username={decodeURIComponent(username)} />
      ))}
    </Suspense>
  );
}

async function UserProfile({ username }: { username: string }) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    data,
  ] = await Promise.all([supabase.auth.getUser(), getProfileData(supabase, { username })]);

  if (!data) {
    return (
      <ProfileMessage
        title="Profile not found"
        body={`There's no one called @${username} on Slopkins.`}
        linkHref="/feed"
        linkLabel="Go to feed"
      />
    );
  }

  return <ProfileView data={data} isOwner={data.profile.id === user?.id} />;
}

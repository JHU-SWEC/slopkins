import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import { getProfileData } from "@/features/auth-social/profile/queries";
import { getRelationships } from "@/features/auth-social/social/queries";
import { getUserPosts } from "@/features/feed/queries";
import { ProfileView } from "@/features/auth-social/profile/profile-view";
import { ProfileMessage, ProfileSkeleton } from "@/features/auth-social/profile/profile-shell";
import { connection } from "next/server";

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
  // Wait for the real request: the sign-in check reads the clock, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    data,
  ] = await Promise.all([getSignedInUser(supabase), getProfileData(supabase, { username })]);

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

  const viewerId = user?.id ?? null;
  const isOwner = data.profile.id === viewerId;
  // Do you follow them, and do they follow you? (For the Follow button.)
  const [{ iFollow, followsMe }, posts] = await Promise.all([
    getRelationships(supabase, viewerId, [data.profile.id]),
    getUserPosts(supabase, viewerId, data.profile.id),
  ]);

  return (
    <ProfileView
      data={data}
      posts={posts}
      isOwner={isOwner}
      viewer={{
        signedIn: viewerId !== null,
        iFollow: iFollow.has(data.profile.id),
        followsMe: followsMe.has(data.profile.id),
      }}
    />
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { FollowListPage } from "@/features/auth-social/social/follow-list-page";
import { PeopleListSkeleton } from "@/features/auth-social/social/people-list-skeleton";

export const metadata: Metadata = { title: "Following · Slopkins" };

// /u/<username>/following — everyone this person follows.
export default function FollowingPage({ params }: PageProps<"/u/[username]/following">) {
  return (
    <Suspense fallback={<PeopleListSkeleton />}>
      {params.then(({ username }) => (
        <FollowListPage username={decodeURIComponent(username)} kind="following" />
      ))}
    </Suspense>
  );
}

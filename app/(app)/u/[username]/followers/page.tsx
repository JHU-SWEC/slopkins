import type { Metadata } from "next";
import { Suspense } from "react";
import { FollowListPage } from "@/features/auth-social/social/follow-list-page";
import { PeopleListSkeleton } from "@/features/auth-social/social/people-list-skeleton";

export const metadata: Metadata = { title: "Followers · Slopkins" };

// /u/<username>/followers — everyone who follows this person.
export default function FollowersPage({ params }: PageProps<"/u/[username]/followers">) {
  return (
    <Suspense fallback={<PeopleListSkeleton />}>
      {params.then(({ username }) => (
        <FollowListPage username={decodeURIComponent(username)} kind="followers" />
      ))}
    </Suspense>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Post } from "@/features/feed/post";
import { getFeed } from "@/features/feed/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Feed · Slopkins" };

// /feed — meals logged by you and the people you follow, with their scores.
export default function FeedPage() {
  return (
    <>
      {/* The home screen shows the app name, like Instagram and Beli. */}
      <h1 className="text-3xl font-extrabold tracking-tight text-heritage-blue dark:text-white">Slopkins</h1>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </>
  );
}

async function Feed() {
  // Wait for the real request: the sign-in check reads cookies, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Empty>
        <Link href="/login" className="font-semibold underline">
          Log in
        </Link>{" "}
        to see what your friends are eating.
      </Empty>
    );
  }

  const { posts, now, viewer } = await getFeed(supabase, user.id);
  if (posts.length === 0) {
    return (
      <Empty>
        Nothing here yet. Log a meal on{" "}
        <Link href="/dining" className="font-semibold underline">
          Dining
        </Link>
        , or{" "}
        <Link href="/search" className="font-semibold underline">
          find people to follow
        </Link>
        .
      </Empty>
    );
  }

  // The label sits just above the newest post, apart from the title.
  return (
    <section className="mt-6" aria-labelledby="feed-label">
      <h2 id="feed-label" className="text-sm text-gray-500">
        Your feed
      </h2>
      <ul className="mt-2 space-y-4">
        {posts.map((post) => (
          <Post key={post.id} post={post} now={now} mine={post.person.id === user.id} viewer={viewer} />
        ))}
      </ul>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
      {children}
    </p>
  );
}

function FeedSkeleton() {
  return (
    // Same label and spacing as the loaded feed, so nothing jumps.
    <div className="mt-6" aria-label="Loading feed">
      <p className="text-sm text-gray-500">Your feed</p>
      <div className="mt-2 animate-pulse space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gray-100" />
              <div className="h-4 flex-1 rounded bg-gray-100" />
            </div>
            <div className="mt-3 h-6 w-2/3 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

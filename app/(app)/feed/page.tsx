import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar } from "@/features/auth-social/profile/avatar";
import { avatarSrc, shownName } from "@/features/auth-social/profile/shared";
import { timeAgo } from "@/features/auth-social/activity/shared";
import { getFeed, type FeedPost } from "@/features/feed/queries";
import { SENTIMENT_STYLES } from "@/features/ranking/components/styles";
import { formatScore } from "@/features/ranking/score";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Feed · Slopkins" };

// /feed — meals logged by you and the people you follow, with their scores.
export default function FeedPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
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

  const { posts, now } = await getFeed(supabase, user.id);
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

  return (
    <ul className="mt-6 space-y-4">
      {posts.map((post) => (
        <Post key={post.id} post={post} now={now} />
      ))}
    </ul>
  );
}

function Post({ post, now }: { post: FeedPost; now: number }) {
  const name = shownName(post.person);
  const profileHref = `/u/${post.person.username}`;
  const comments = post.dishes.filter((dish) => dish.ranking?.comment);

  return (
    <li className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <Link href={profileHref} className="shrink-0">
          <Avatar src={avatarSrc(post.person.avatar_url)} name={name} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={profileHref} className="font-semibold hover:underline">
            {name}
          </Link>
          <p className="text-sm text-gray-500">
            {post.hall ? (
              <Link href={`/dining/${post.hall.slug}`} className="hover:underline">
                {post.hall.name}
              </Link>
            ) : (
              "A dining hall"
            )}
            {post.meal && <span className="capitalize"> · {post.meal}</span>}
          </p>
        </div>
        <time dateTime={post.at} className="text-xs text-gray-400">
          {timeAgo(post.at, now)}
        </time>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {post.dishes.map((dish) => (
          <li
            key={dish.id}
            className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm text-gray-700"
          >
            {dish.name}
            {dish.ranking ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                  SENTIMENT_STYLES[dish.ranking.sentiment].score
                }`}
              >
                {formatScore(dish.ranking.score)}
              </span>
            ) : (
              <span className="pr-2" />
            )}
          </li>
        ))}
      </ul>

      {comments.map((dish) => (
        <p
          key={dish.id}
          className="mt-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600"
        >
          <span className="not-italic font-medium text-gray-700">{dish.name}:</span> {dish.ranking?.comment}
        </p>
      ))}
    </li>
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
    <div className="mt-6 animate-pulse space-y-4" aria-label="Loading feed">
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
  );
}

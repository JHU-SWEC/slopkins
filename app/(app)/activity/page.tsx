import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import { ActivityList } from "@/features/auth-social/activity/activity-list";
import { MarkActivitySeen } from "@/features/auth-social/activity/mark-seen";
import { getActivity } from "@/features/auth-social/activity/queries";
import { ACTIVITY_SEEN_COOKIE } from "@/features/auth-social/activity/shared";

export const metadata: Metadata = { title: "Activity · Slopkins" };

// /activity — things people did to you: follows, and likes, comments and bookmarks on your posts.
export default function ActivityPage() {
  return (
    <div className="text-heritage-blue dark:text-white">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Activity</h1>
      <Suspense fallback={<ActivitySkeleton />}>
        <Activity />
      </Suspense>
    </div>
  );
}

async function Activity() {
  // Wait for the real request: the sign-in check reads the clock, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);

  if (!user) {
    return (
      <Empty>
        <Link href="/login" className="font-semibold underline">
          Log in
        </Link>{" "}
        to see who followed you and who liked, commented on or bookmarked your posts.
      </Empty>
    );
  }

  const [{ items, now }, cookieStore] = await Promise.all([getActivity(supabase, user.id), cookies()]);
  const lastSeen = cookieStore.get(ACTIVITY_SEEN_COOKIE)?.value ?? null;

  return (
    <>
      <MarkActivitySeen />
      {items.length === 0 ? (
        <Empty>
          Nothing here yet. When people follow you, or like, comment on or bookmark your posts,
          it&apos;ll show up here.{" "}
          <Link href="/search" className="font-semibold underline">
            Find people to follow
          </Link>
        </Empty>
      ) : (
        <ActivityList items={items} lastSeen={lastSeen} now={now} />
      )}
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-white/60">
      {children}
    </p>
  );
}

function ActivitySkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading activity">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-slate-100 dark:bg-white/10" />
          <div className="h-4 flex-1 rounded bg-slate-100 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import { ProfileMessage } from "../profile/profile-shell";
import { getBasicProfile } from "../profile/queries";
import { shownName } from "../profile/shared";
import { PeopleList } from "./people-list";
import { getFollowCounts, getFollowList } from "./queries";
import { connection } from "next/server";

// /u/<username>/followers and /u/<username>/following.
// Like Instagram: two tabs at the top, a list of people underneath.
export async function FollowListPage({
  username,
  kind,
}: {
  username: string;
  kind: "followers" | "following";
}) {
  // Wait for the real request: the sign-in check reads the clock, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    profile,
  ] = await Promise.all([getSignedInUser(supabase), getBasicProfile(supabase, { username })]);

  if (!profile) {
    return (
      <ProfileMessage
        title="Profile not found"
        body={`There's no one called @${username} on Slopkins.`}
        linkHref="/search"
        linkLabel="Search people"
      />
    );
  }

  const viewerId = user?.id ?? null;
  const [counts, people] = await Promise.all([
    getFollowCounts(supabase, profile.id),
    getFollowList(supabase, profile.id, kind, viewerId),
  ]);
  const isMe = profile.id === viewerId;

  const empty =
    kind === "followers"
      ? isMe
        ? "No followers yet. Share your profile so friends can find you."
        : "No followers yet."
      : isMe
        ? (
            <>
              You aren&apos;t following anyone yet.{" "}
              <Link href="/search" className="font-semibold text-heritage-blue underline">
                Find people
              </Link>
            </>
          )
        : "Not following anyone yet.";

  return (
    <div className="text-heritage-blue">
      <Link
        href={`/u/${profile.username}`}
        className="text-sm font-semibold underline-offset-2 hover:underline"
      >
        ‹ Back to profile
      </Link>
      <h1 className="mt-3 truncate text-2xl font-bold tracking-tight">{shownName(profile)}</h1>
      {profile.display_name && <p className="text-slate-500">@{profile.username}</p>}

      <nav aria-label="Followers and following" className="mt-5 grid grid-cols-2 border-b border-slate-200">
        <Tab
          href={`/u/${profile.username}/followers`}
          active={kind === "followers"}
          label={`${counts.followers} ${counts.followers === 1 ? "Follower" : "Followers"}`}
        />
        <Tab
          href={`/u/${profile.username}/following`}
          active={kind === "following"}
          label={`${counts.following} Following`}
        />
      </nav>

      <div className="mt-2">
        <PeopleList people={people} viewerId={viewerId} empty={empty} />
      </div>
    </div>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      replace
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 py-3 text-center text-sm font-semibold transition ${
        active ? "border-heritage-blue text-heritage-blue" : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
    </Link>
  );
}

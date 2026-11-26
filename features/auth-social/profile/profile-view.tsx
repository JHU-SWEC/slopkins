import Link from "next/link";
import MyList from "@/features/ranking/components/MyList";
import WantToTry from "@/features/ranking/components/WantToTry";
import { ProfileTabs } from "./profile-tabs";
import { RecentRankings } from "./recent-rankings";
import { logOut } from "../actions";
import { FollowButton } from "../social/follow-button";
import { Avatar } from "./avatar";
import { ShareButton } from "./share-button";
import {
  avatarSrc,
  isPlaceholderUsername,
  shownName,
  type ProfileData,
} from "./shared";

/** How the person looking at the page relates to this profile. */
export type Viewer = { signedIn: boolean; iFollow: boolean; followsMe: boolean };

// The whole profile page. `isOwner` = you're looking at your own profile,
// which adds Edit / Log out, your own ranked list, and "add something" hints. Anyone else
// sees a Follow button instead.
export function ProfileView({
  data,
  isOwner,
  viewer = { signedIn: false, iFollow: false, followsMe: false },
}: {
  data: ProfileData;
  isOwner: boolean;
  viewer?: Viewer;
}) {
  const { profile, rankedDishes, wantToTry, savedPlates } = data;
  const name = shownName(profile);

  return (
    <div className="text-heritage-blue dark:text-white">
      {/* New accounts start with a placeholder username; nudge them to pick a real one. */}
      {isOwner && isPlaceholderUsername(profile.username) && (
        <Link
          href="/profile/edit"
          className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-spirit-blue/25 px-4 py-3 transition hover:bg-spirit-blue/35"
        >
          <span>
            <span className="block font-semibold">Finish setting up your profile</span>
            <span className="text-sm text-heritage-blue/80 dark:text-white/70">
              Add a photo and pick your name and username.
            </span>
          </span>
          <span aria-hidden="true" className="text-xl">
            ›
          </span>
        </Link>
      )}

      {/* ---------- 1. Header: photo | name, username, stats; then tags, bio, Follow ---------- */}
      <section className="relative pt-2">
        {/* Top right: edit (your own profile only) and share. */}
        <div data-tour="profile-actions" className="absolute right-0 top-0 flex gap-1">
          {isOwner && (
            <Link href="/profile/edit" aria-label="Edit profile" title="Edit profile" className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
              {/* Pencil */}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                <path d="m15 5 4 4" />
              </svg>
            </Link>
          )}
          <ShareButton username={profile.username} className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" />
        </div>

        {/* Photo on the left; name, username, and stats on the right. */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="shrink-0 rounded-full ring-1 ring-slate-200">
            <Avatar src={avatarSrc(profile.avatar_url)} name={name} size={80} eager />
          </div>
          <div className="min-w-0 flex-1">
            {/* pr keeps a long name from running under the edit/share icons. */}
            <div className="pr-20">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{name}</h1>
              <p className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {profile.display_name && <span className="truncate">@{profile.username}</span>}
                {!isOwner && viewer.followsMe && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    Follows you
                  </span>
                )}
              </p>
            </div>

            {/* Stats, like the counts on an Instagram profile. */}
            <div aria-label="Stats" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Stat
                value={data.followers}
                label={data.followers === 1 ? "follower" : "followers"}
                href={`/u/${profile.username}/followers`}
              />
              <Stat value={data.following} label="following" href={`/u/${profile.username}/following`} />
              <Stat
                value={data.rank ? `#${data.rank.position}` : "–"}
                label={data.rank ? `of ${data.rank.totalUsers}` : "rank"}
              />
            </div>
          </div>
        </div>

        {(profile.grade || profile.major) && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {profile.grade && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{profile.grade}</span>}
            {profile.major && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{profile.major}</span>}
          </div>
        )}

        {/* Only if they've written one. */}
        {profile.bio && <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{profile.bio}</p>}

        {!isOwner && (
          <div className="mt-5">
            <FollowButton
              targetId={profile.id}
              username={profile.username}
              following={viewer.iFollow}
              followsMe={viewer.followsMe}
              signedIn={viewer.signedIn}
            />
          </div>
        )}
      </section>

      {/* ---------- 2. Tabs: My posts (default), Ranked Dishes, Want to Try ---------- */}
      <ProfileTabs
        tabs={[
          {
            id: "activity",
            // "My posts" on your own profile, "Posts" on someone else's.
            label: isOwner ? "My posts" : "Posts",
            panel: <RecentRankings dishes={rankedDishes} now={data.loadedAt} isOwner={isOwner} />,
          },
          {
            id: "ranked",
            label: "Ranked Dishes",
            panel: <MyList list={rankedDishes} isOwner={isOwner} />,
          },
          // Saved dishes are private, so only you see this tab.
          ...(isOwner
            ? [
                {
                  id: "want-to-try",
                  label: "Want to Try",
                  panel: <WantToTry items={wantToTry} plates={savedPlates} />,
                },
              ]
            : []),
        ]}
      />

      {isOwner && (
        <form action={logOut} className="mt-10 text-center">
          <button
            type="submit"
            className="text-sm font-medium text-slate-400 transition hover:text-slate-900"
          >
            Log out
          </button>
        </form>
      )}
    </div>
  );
}

// ---------- Small building blocks used above ----------

// One number in the header's stat row. With `href`, it's a link (like tapping
// "Followers" on Instagram).
function Stat({ value, label, href }: { value: number | string; label: string; href?: string }) {
  const inner = (
    <>
      <span className="font-bold text-slate-900">{value}</span> <span className="text-slate-500">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className="whitespace-nowrap transition hover:opacity-70">
      {inner}
    </Link>
  ) : (
    <span className="whitespace-nowrap">{inner}</span>
  );
}

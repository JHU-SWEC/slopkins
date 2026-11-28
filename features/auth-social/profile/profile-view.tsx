import Link from "next/link";
import type { PostList } from "@/features/feed/queries";
import { RankingsList } from "@/features/ranking/components/rankings-list";
import WantToTry from "@/features/ranking/components/WantToTry";
import type { RankedPlate } from "@/features/ranking/types";
import { ProfileTabs } from "./profile-tabs";
import { ProfilePosts } from "./profile-posts";
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
// which adds Edit, your own ranked list, and "add something" hints. Anyone else
// sees a Follow button instead.
export function ProfileView({
  data,
  posts,
  rankedPlates,
  isOwner,
  viewer = { signedIn: false, iFollow: false, followsMe: false },
}: {
  data: ProfileData;
  /** Their logged meals, shown like the feed. */
  posts: PostList;
  /** Every plate they ranked, best first (Rankings tab). */
  rankedPlates: RankedPlate[];
  isOwner: boolean;
  viewer?: Viewer;
}) {
  const { profile, wantToTry, savedPlates } = data;
  const name = shownName(profile);

  return (
    // On phones the ?, settings, and bell buttons float at the top right
    // (top-3, 36px tall, so they end 48px down). Main's py-8 starts the page at
    // 32px; pt-6 pushes it to 56px so edit and share sit just below them.
    // Laptops have no floating buttons (they're in the sidebar).
    <div className="pt-6 text-heritage-blue md:pt-0 dark:text-white">
      {/* New accounts start with a placeholder username; nudge them to pick a real one. */}
      {isOwner && isPlaceholderUsername(profile.username) && (
        // One quiet line, like the empty states: no colored block.
        <Link
          href="/profile/edit"
          className="mb-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-3 text-sm transition hover:text-brand"
        >
          <span>
            <span className="font-semibold">Finish your profile:</span>{" "}
            <span className="text-gray-500">add a photo and pick your username.</span>
          </span>
          <span aria-hidden="true" className="font-semibold text-brand">
            ›
          </span>
        </Link>
      )}

      {/* ---------- 1. Header: photo | name, username, stats; then tags, bio, Follow ---------- */}
      <section className="relative pt-2">
        {/* Top right: the pencil (your profile) or Follow (anyone else's), then share. */}
        <div data-tour="profile-actions" className="absolute right-0 top-0 flex items-center gap-1">
          {isOwner ? (
            <Link href="/profile/edit" aria-label="Edit profile" title="Edit profile" className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900">
              {/* Pencil */}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                <path d="m15 5 4 4" />
              </svg>
            </Link>
          ) : (
            <FollowButton
              targetId={profile.id}
              username={profile.username}
              following={viewer.iFollow}
              followsMe={viewer.followsMe}
              signedIn={viewer.signedIn}
              size="compact"
            />
          )}
          <ShareButton username={profile.username} className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900" />
        </div>

        {/* Photo on the left; name, username, and stats on the right. */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="shrink-0 rounded-full ring-1 ring-gray-200">
            <Avatar src={avatarSrc(profile.avatar_url)} name={name} size={80} eager />
          </div>
          <div className="min-w-0 flex-1">
            {/* pr keeps a long name from running under the buttons on the right. */}
            <div className={isOwner ? "pr-20" : "pr-36"}>
              {/* Long names wrap to a second line instead of cutting off. */}
              <h1 className="line-clamp-2 break-words text-xl font-bold leading-tight tracking-tight text-gray-900">{name}</h1>
              <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {profile.display_name && <span className="truncate">@{profile.username}</span>}
                {!isOwner && viewer.followsMe && (
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
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
              {/* "#3 rank". Hidden until they've ranked a dish. */}
              {data.rank && <Stat value={`#${data.rank.position}`} label="rank" />}
            </div>
          </div>
        </div>

        {(profile.grade || profile.major) && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {profile.grade && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{profile.grade}</span>}
            {profile.major && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{profile.major}</span>}
          </div>
        )}

        {/* Only if they've written one. */}
        {profile.bio && <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{profile.bio}</p>}

      </section>

      {/* ---------- 2. Tabs: Activity (posts by date), Rankings (your list, best first), Want to Try ---------- */}
      <ProfileTabs
        tabs={[
          {
            id: "activity",
            label: "Activity",
            panel: <ProfilePosts list={posts} isOwner={isOwner} signedIn={isOwner || viewer.signedIn} />,
          },
          {
            id: "rankings",
            label: "Rankings",
            panel: <RankingsList plates={rankedPlates} isOwner={isOwner} />,
          },
          // Public, like the rest of the profile; only you can remove things.
          {
            id: "want-to-try",
            label: "Want to Try",
            panel: <WantToTry items={wantToTry} plates={savedPlates} isOwner={isOwner} />,
          },
        ]}
      />

    </div>
  );
}

// ---------- Small building blocks used above ----------

// One number in the header's stat row. With `href`, it's a link (like tapping
// "Followers" on Instagram).
function Stat({ value, label, href }: { value: number | string; label?: string; href?: string }) {
  const inner = (
    <>
      <span className="font-bold text-gray-900">{value}</span>
      {label && <span className="text-gray-500"> {label}</span>}
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

import Link from "next/link";
import MyList from "@/features/ranking/components/MyList";
import { logOut } from "../actions";
import { FollowButton } from "../social/follow-button";
import { Avatar } from "./avatar";
import { ShareButton } from "./share-button";
import {
  avatarSrc,
  isPlaceholderUsername,
  shownName,
  type DiningHall,
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
  const { profile, rankedDishes, visited, wantToGo } = data;
  const name = shownName(profile);
  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(profile.created_at));

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

      {/* ---------- 1. Header: photo, name, details, bio, buttons ---------- */}
      <section className="overflow-hidden rounded-3xl bg-linear-to-br from-heritage-blue to-[#1d5aa8] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="w-fit rounded-full ring-4 ring-white/30">
            <Avatar src={avatarSrc(profile.avatar_url)} name={name} size={96} eager />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
            <p className="flex flex-wrap items-center gap-2 text-white/70">
              {profile.display_name && <span>@{profile.username}</span>}
              {!isOwner && viewer.followsMe && (
                <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-medium text-white">
                  Follows you
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-white/60">Member since {memberSince}</p>
          </div>
        </div>

        {(profile.grade || profile.major) && (
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {profile.grade && <span className="rounded-full bg-white/15 px-3 py-1">{profile.grade}</span>}
            {profile.major && <span className="rounded-full bg-white/15 px-3 py-1">{profile.major}</span>}
          </div>
        )}

        {profile.bio ? (
          <p className="mt-4 whitespace-pre-line text-white/90">{profile.bio}</p>
        ) : (
          isOwner &&
          data.detailsReady && (
            <p className="mt-4 text-sm text-white/60">
              Add a bio, grade, and major from{" "}
              <Link href="/profile/edit" className="underline">
                Edit profile
              </Link>
              .
            </p>
          )
        )}

        <div data-tour="profile-actions" className="mt-6 flex flex-wrap items-start gap-2">
          {!isOwner && (
            <FollowButton
              targetId={profile.id}
              username={profile.username}
              following={viewer.iFollow}
              followsMe={viewer.followsMe}
              signedIn={viewer.signedIn}
              tone="dark"
            />
          )}
          {isOwner && (
            <Link
              href="/profile/edit"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-heritage-blue transition hover:bg-white/90 dark:text-white dark:hover:bg-background/80"
            >
              Edit profile
            </Link>
          )}
          <ShareButton
            username={profile.username}
            className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          />
        </div>
      </section>

      {/* ---------- 2. Stats: four numbers at a glance ---------- */}
      <section aria-label="Stats" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={rankedDishes.length} label="Dishes ranked" />
        <Stat
          value={data.rank ? `#${data.rank.position}` : "–"}
          label={data.rank ? `Rank of ${data.rank.totalUsers} on Slopkins` : "Rank on Slopkins"}
        />
        <Stat
          value={data.followers}
          label={data.followers === 1 ? "Follower" : "Followers"}
          href={`/u/${profile.username}/followers`}
        />
        <Stat value={data.following} label="Following" href={`/u/${profile.username}/following`} />
      </section>

      {/* ---------- 3. Section menu: sticks to the top while scrolling ---------- */}
      <nav
        aria-label="Profile sections"
        className="sticky top-0 z-10 -mx-4 mt-6 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur dark:bg-background/90"
      >
        <ul className="flex gap-1 overflow-x-auto text-sm font-semibold">
          <SectionLink href="#ranked" label="Ranked dishes" count={rankedDishes.length} />
          <SectionLink href="#been-to" label="Been to" count={visited.length} />
          <SectionLink href="#want-to-go" label="Want to go" count={wantToGo.length} />
        </ul>
      </nav>

      {/* ---------- 4. Ranked dishes, best first ---------- */}
      <Section id="ranked" title="Ranked dishes">
        <MyList list={rankedDishes} isOwner={isOwner} />
      </Section>

      {/* ---------- 5. Dining halls ---------- */}
      <Section id="been-to" title="Been to">
        <HallList
          halls={visited}
          empty={isOwner ? "Check off halls you've been to in Edit profile." : "Nothing here yet."}
        />
      </Section>
      <Section id="want-to-go" title="Want to go">
        <HallList
          halls={wantToGo}
          empty={isOwner ? "Save halls you want to try in Edit profile." : "Nothing here yet."}
        />
      </Section>

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

// A number tile. With `href`, the whole tile is a link (like tapping
// "Followers" on Instagram).
function Stat({ value, label, href }: { value: number | string; label: string; href?: string }) {
  const tile = "block rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm";
  const inner = (
    <>
      <span className="block text-2xl font-bold">{value}</span>
      <span className="mt-1 block text-xs font-medium text-slate-500">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className={`${tile} transition hover:border-spirit-blue hover:bg-spirit-blue/10`}>
      {inner}
    </Link>
  ) : (
    <div className={tile}>{inner}</div>
  );
}

function SectionLink({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <li>
      <a
        href={href}
        className="flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 transition hover:bg-spirit-blue/20"
      >
        {label}
        <span className="rounded-full bg-spirit-blue/25 px-2 text-xs">{count}</span>
      </a>
    </li>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  // scroll-mt keeps the heading from hiding under the sticky menu after a jump.
  return (
    <section id={id} className="mt-6 scroll-mt-16">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

function HallList({ halls, empty }: { halls: DiningHall[]; empty: string }) {
  if (halls.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {halls.map((hall) => (
        <li key={hall.id}>
          <Link
            href={`/dining/${hall.slug}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 font-semibold shadow-sm transition hover:bg-slate-50"
          >
            {hall.name}
            <span className="text-slate-300">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

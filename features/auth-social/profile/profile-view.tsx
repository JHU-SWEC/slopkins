import Link from "next/link";
import { SCORE_RANGES } from "@/features/ranking/score";
import { SENTIMENT_STYLES } from "@/features/ranking/components/styles";
import { logOut } from "../actions";
import { Avatar } from "./avatar";
import { ShareButton } from "./share-button";
import { avatarSrc, shownName, type DiningHall, type ProfileData, type RankedDish } from "./shared";

// The whole profile page. `isOwner` = you're looking at your own profile,
// which adds Edit / My list / Log out and "add something" hints.
export function ProfileView({ data, isOwner }: { data: ProfileData; isOwner: boolean }) {
  const { profile, rankedDishes, visited, wantToGo } = data;
  const name = shownName(profile);
  const memberSince = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(profile.created_at));

  return (
    <div className="text-heritage-blue">
      {/* ---------- 1. Header: photo, name, details, bio, buttons ---------- */}
      <section className="overflow-hidden rounded-3xl bg-linear-to-br from-heritage-blue to-[#1d5aa8] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="w-fit rounded-full ring-4 ring-white/30">
            <Avatar src={avatarSrc(profile.avatar_url)} name={name} size={96} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
            {profile.display_name && <p className="text-white/70">@{profile.username}</p>}
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
          isOwner && (
            <p className="mt-4 text-sm text-white/60">
              Add a bio, grade, and major from{" "}
              <Link href="/profile/edit" className="underline">
                Edit profile
              </Link>
              .
            </p>
          )
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {isOwner && (
            <Link
              href="/profile/edit"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-heritage-blue transition hover:bg-white/90"
            >
              Edit profile
            </Link>
          )}
          <ShareButton
            username={profile.username}
            className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          />
          {isOwner && (
            <Link
              href="/my-list"
              className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              My list
            </Link>
          )}
        </div>
      </section>

      {/* ---------- 2. Stats: four numbers at a glance ---------- */}
      <section aria-label="Stats" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={rankedDishes.length} label="Dishes ranked" />
        <Stat
          value={data.rank ? `#${data.rank.position}` : "–"}
          label={data.rank ? `Rank of ${data.rank.totalUsers} on Slopkins` : "Rank on Slopkins"}
        />
        <Stat value={data.followers} label={data.followers === 1 ? "Follower" : "Followers"} />
        <Stat value={data.following} label="Following" />
      </section>

      {/* ---------- 3. Section menu: sticks to the top while scrolling ---------- */}
      <nav
        aria-label="Profile sections"
        className="sticky top-0 z-10 -mx-4 mt-6 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur"
      >
        <ul className="flex gap-1 overflow-x-auto text-sm font-semibold">
          <SectionLink href="#ranked" label="Ranked dishes" count={rankedDishes.length} />
          <SectionLink href="#been-to" label="Been to" count={visited.length} />
          <SectionLink href="#want-to-go" label="Want to go" count={wantToGo.length} />
        </ul>
      </nav>

      {/* ---------- 4. Ranked dishes, best first ---------- */}
      <Section id="ranked" title="Ranked dishes">
        <RankList
          dishes={rankedDishes}
          empty={isOwner ? "You haven't ranked any dishes yet." : "No dishes ranked yet."}
          isOwner={isOwner}
        />
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

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
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

// Same colors as the ranking team's "My list": green = liked, amber = fine, red = didn't like.
function scoreStyle(score: number) {
  if (score >= SCORE_RANGES.liked.min) return SENTIMENT_STYLES.liked.score;
  if (score >= SCORE_RANGES.fine.min) return SENTIMENT_STYLES.fine.score;
  return SENTIMENT_STYLES.disliked.score;
}

function RankList({ dishes, empty, isOwner }: { dishes: RankedDish[]; empty: string; isOwner: boolean }) {
  if (dishes.length === 0) {
    return (
      <Empty>
        {empty}{" "}
        {isOwner && (
          <Link href="/rank" className="font-semibold text-heritage-blue underline">
            Rank a dish
          </Link>
        )}
      </Empty>
    );
  }
  return (
    <ol className="space-y-2">
      {dishes.map((dish, index) => (
        <li
          key={dish.dishId}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <span className="w-7 shrink-0 text-center text-lg font-bold text-slate-300">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{dish.name}</p>
            {dish.comment && (
              <p className="mt-1 border-l-2 border-slate-200 pl-3 text-sm italic text-slate-600">
                {dish.comment}
              </p>
            )}
          </div>
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold shadow-sm ${scoreStyle(dish.score)}`}
            aria-label={`Score ${dish.score.toFixed(1)} out of 10`}
          >
            {dish.score.toFixed(1)}
          </span>
        </li>
      ))}
    </ol>
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

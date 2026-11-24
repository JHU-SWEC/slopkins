import Link from "next/link";
import { SCORE_RANGES, formatScore } from "@/features/ranking/score";
import { SENTIMENT_STYLES } from "@/features/ranking/components/styles";
import type { Sentiment } from "@/features/ranking/types";
import { Avatar } from "../profile/avatar";
import { avatarSrc, shownName } from "../profile/shared";
import { FollowButton } from "../social/follow-button";
import type { ActivityItem } from "./queries";
import { timeAgo } from "./shared";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Groups like Instagram: New (since your last visit), This week, Earlier.
export function ActivityList({
  items,
  lastSeen,
  now,
}: {
  items: ActivityItem[];
  /** When you last opened Activity (ISO), or null on your first visit. */
  lastSeen: string | null;
  now: number;
}) {
  const isNew = (item: ActivityItem) => lastSeen !== null && item.at > lastSeen;
  const weekAgo = new Date(now - WEEK_MS).toISOString();

  const groups = [
    { title: "New", items: items.filter(isNew) },
    { title: "This week", items: items.filter((i) => !isNew(i) && i.at >= weekAgo) },
    { title: "Earlier", items: items.filter((i) => !isNew(i) && i.at < weekAgo) },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{group.title}</h2>
          <ul className="mt-1 divide-y divide-slate-100 dark:divide-white/10">
            {group.items.map((item) => (
              <Row key={item.key} item={item} highlighted={group.title === "New"} now={now} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Row({ item, highlighted, now }: { item: ActivityItem; highlighted: boolean; now: number }) {
  const name = shownName(item.person);
  const profileHref = `/u/${item.person.username}`;

  return (
    <li
      className={`-mx-3 flex items-start gap-3 rounded-2xl px-3 py-3 ${
        highlighted ? "bg-spirit-blue/15 dark:bg-spirit-blue/10" : ""
      }`}
    >
      <Link href={profileHref} className="shrink-0">
        <Avatar src={avatarSrc(item.person.avatar_url)} name={name} size={44} />
      </Link>

      <div className="min-w-0 flex-1 text-sm leading-snug">
        <p>
          <Link href={profileHref} className="font-semibold hover:underline">
            {name}
          </Link>{" "}
          <Sentence item={item} />{" "}
          <time dateTime={item.at} className="whitespace-nowrap text-slate-400">
            {timeAgo(item.at, now)}
          </time>
        </p>
        {item.kind === "ranking" && item.comment && (
          <p className="mt-1 border-l-2 border-slate-200 pl-3 italic text-slate-600 dark:border-white/20 dark:text-white/70">
            {item.comment}
          </p>
        )}
      </div>

      {item.kind === "follow" && (
        <FollowButton
          targetId={item.person.id}
          username={item.person.username}
          following={item.iFollow}
          followsMe
          signedIn
          className="shrink-0"
        />
      )}
      {item.kind === "ranking" && <ScoreBadge score={item.score} sentiment={item.sentiment} />}
    </li>
  );
}

function Sentence({ item }: { item: ActivityItem }) {
  switch (item.kind) {
    case "follow":
      return <>started following you.</>;
    case "ranking":
      return (
        <>
          rated <span className="font-semibold">{item.dish.name}</span>.
        </>
      );
    case "meal": {
      const dishes = item.dishCount === 1 ? "1 dish" : `${item.dishCount} dishes`;
      const what = item.meal ? `logged ${item.meal}` : "logged a meal";
      return (
        <>
          {what}
          {item.hall && (
            <>
              {" "}
              at{" "}
              <Link href={`/dining/${item.hall.slug}`} className="font-semibold hover:underline">
                {item.hall.name}
              </Link>
            </>
          )}
          {item.dishCount > 0 && <span className="text-slate-500 dark:text-white/60"> · {dishes}</span>}.
        </>
      );
    }
  }
}

// Same colors as the profile's ranked list: green = liked, amber = fine, red = didn't like.
function ScoreBadge({ score, sentiment }: { score: number; sentiment: Sentiment | null }) {
  const band: Sentiment =
    sentiment ?? (score >= SCORE_RANGES.liked.min ? "liked" : score >= SCORE_RANGES.fine.min ? "fine" : "disliked");
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold shadow-sm ${SENTIMENT_STYLES[band].score}`}
      aria-label={`Score ${formatScore(score)} out of 10`}
    >
      {formatScore(score)}
    </span>
  );
}

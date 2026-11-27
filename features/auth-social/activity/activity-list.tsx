import Link from "next/link";
import { Avatar } from "../profile/avatar";
import { avatarSrc, shownName } from "../profile/shared";
import { FollowButton } from "../social/follow-button";
import type { ActivityItem } from "./queries";
import { timeAgo } from "./shared";

// Two groups: New (since your last visit) and Earlier (everything else).
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

  const groups = [
    { title: "New", items: items.filter(isNew) },
    { title: "Earlier", items: items.filter((i) => !isNew(i)) },
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
    </li>
  );
}

function Sentence({ item }: { item: ActivityItem }) {
  switch (item.kind) {
    case "follow":
      return <>started following you.</>;
    case "comment":
      return (
        <>
          commented: <span className="italic text-slate-500 dark:text-white/60">{item.body}</span> on your{" "}
          {item.meal ?? "meal"}
          {item.hall && (
            <>
              {" "}
              at{" "}
              <Link href={`/dining/${item.hall.slug}`} className="font-semibold hover:underline">
                {item.hall.name}
              </Link>
            </>
          )}
          .
        </>
      );
    case "like":
      return (
        <>
          liked your {item.meal ?? "meal"}
          {item.hall && (
            <>
              {" "}
              at{" "}
              <Link href={`/dining/${item.hall.slug}`} className="font-semibold hover:underline">
                {item.hall.name}
              </Link>
            </>
          )}
          .
        </>
      );
    case "save":
      return (
        <>
          bookmarked your {item.meal ?? "meal"}
          {item.hall && (
            <>
              {" "}
              at{" "}
              <Link href={`/dining/${item.hall.slug}`} className="font-semibold hover:underline">
                {item.hall.name}
              </Link>
            </>
          )}
          .
        </>
      );
  }
}

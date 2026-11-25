import Link from "next/link";
import { Avatar } from "../profile/avatar";
import { avatarSrc, shownName } from "../profile/shared";
import { FollowButton } from "./follow-button";
import type { Person } from "./queries";

// A list of people: photo, name, @username, and a Follow button.
// Used for followers, following, and search results.
export function PeopleList({
  people,
  viewerId,
  empty,
}: {
  people: Person[];
  /** The signed-in user's id, or null if signed out. */
  viewerId: string | null;
  empty: React.ReactNode;
}) {
  if (people.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-white/60">
        {empty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/10">
      {people.map((person) => {
        const name = shownName(person);
        return (
          <li key={person.id} className="flex items-center gap-3 py-3">
            <Link href={`/u/${person.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar src={avatarSrc(person.avatar_url)} name={name} size={48} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{name}</span>
                <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/60">
                  {person.display_name && <span className="truncate">@{person.username}</span>}
                  {person.followsMe && (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium dark:bg-white/10">
                      Follows you
                    </span>
                  )}
                </span>
              </span>
            </Link>
            {person.id === viewerId ? (
              <span className="text-sm text-slate-400 dark:text-white/50">You</span>
            ) : (
              <FollowButton
                targetId={person.id}
                username={person.username}
                following={person.iFollow}
                followsMe={person.followsMe}
                signedIn={viewerId !== null}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

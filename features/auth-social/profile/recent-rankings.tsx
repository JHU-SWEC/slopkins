import Link from "next/link";
import type { RankedDish } from "@/features/ranking/types";
import { primaryButton } from "@/features/ranking/components/styles";
import { DishMeta } from "@/features/ranking/components/ui";
import { ScoreBadge } from "../activity/activity-list";
import { timeAgo } from "../activity/shared";

const LIMIT = 30;

/**
 * A person's rankings as posts, newest first, like an Instagram profile.
 * Uses created_at (when the dish first went on their list): updated_at also
 * changes whenever another ranking re-spreads the scores in its group.
 */
export function RecentRankings({
  dishes,
  now,
  isOwner,
}: {
  dishes: RankedDish[];
  now: number;
  isOwner: boolean;
}) {
  const posts = [...dishes].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, LIMIT);

  if (posts.length === 0) {
    return isOwner ? (
      <div className="mt-6 text-center">
        <p className="text-gray-500">Rank a plate to start!</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Browse menus
        </Link>
      </div>
    ) : (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        Nothing yet.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-slate-100 dark:divide-white/10">
      {posts.map((post) => (
        <li key={post.dish_id} className="flex items-start gap-3 py-3">
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <p>
              Rated <span className="font-semibold">{post.dish.name}</span>{" "}
              <time dateTime={post.created_at} className="whitespace-nowrap text-slate-400">
                · {timeAgo(post.created_at, now)}
              </time>
            </p>
            <DishMeta dish={post.dish} />
            {post.comment && (
              <p className="mt-1 border-l-2 border-slate-200 pl-3 italic text-slate-600 dark:border-white/20 dark:text-white/70">
                {post.comment}
              </p>
            )}
          </div>
          <ScoreBadge score={post.score} sentiment={post.sentiment} />
        </li>
      ))}
    </ol>
  );
}

import Link from "next/link";
import { SENTIMENT_ORDER, getSentimentGroup } from "../insertion";
import type { RankedDish } from "../types";
import { SENTIMENT_LABELS, listBox, primaryButton, sectionHeading } from "./styles";
import { DishMeta, Score } from "./ui";

/**
 * A ranked list grouped by liked / fine / didn't like, best first.
 * Shown under "Ranked dishes" on every profile; `isOwner` changes the empty state.
 */
export default function MyList({ list, isOwner }: { list: RankedDish[]; isOwner: boolean }) {
  if (list.length === 0) {
    return isOwner ? (
      <div className="mt-6 text-center">
        <p className="text-gray-500">Log a meal to start ranking dishes.</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Log a meal
        </Link>
      </div>
    ) : (
      <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        No dishes ranked yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {SENTIMENT_ORDER.map((s) => {
        const group = getSentimentGroup(list, s);
        if (group.length === 0) return null;
        return (
          <section key={s}>
            <h3 className={sectionHeading}>
              {SENTIMENT_LABELS[s].heading} · {group.length}
            </h3>
            <ol className={`mt-2 ${listBox}`}>
              {group.map((item) => (
                <li
                  key={item.dish_id}
                  // The guided tour points at your #1 dish.
                  data-tour={isOwner && item.rank === 1 ? "my-list" : undefined}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span className="w-6 shrink-0 text-gray-400 tabular-nums">{item.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.dish.name}</p>
                    <DishMeta dish={item.dish} />
                    {item.comment && (
                      <p className="mt-1 text-sm text-gray-600">&ldquo;{item.comment}&rdquo;</p>
                    )}
                  </div>
                  <Score score={item.score} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

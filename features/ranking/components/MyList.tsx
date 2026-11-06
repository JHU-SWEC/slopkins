"use client";

import Link from "next/link";
import { use, useState } from "react";
import { browser } from "react-dom";
import { SENTIMENT_ORDER, getSentimentGroup } from "../insertion";
import { getDishScore } from "../score";
import { getCurrentUserId, getRankedDishes, resetToMockData } from "../store";
import { HallChip } from "./RankFlow";
import { SENTIMENT_STYLES, enter, primaryButton } from "./styles";

export default function MyList() {
  use(browser("Rankings are saved in this browser's localStorage."));

  const userId = getCurrentUserId();
  const [list, setList] = useState(() => getRankedDishes(userId));

  function handleReset() {
    resetToMockData();
    setList(getRankedDishes(userId));
  }

  if (list.length === 0) {
    return (
      <div
        className={`mt-8 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center ${enter}`}
      >
        <div className="text-4xl">🍽️</div>
        <p className="mt-3 text-lg font-semibold">Your list is empty</p>
        <p className="mt-1 text-sm text-slate-500">Rank your first dish to get started.</p>
        <Link href="/rank" className={`mt-6 ${primaryButton}`}>
          Rank a dish
        </Link>
      </div>
    );
  }

  const top = list[0];

  return (
    <>
      <div
        className={`mt-8 overflow-hidden rounded-3xl bg-linear-to-br from-[#002D72] to-[#1d5aa8] p-6 text-white shadow-lg sm:p-8 ${enter}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Your #1
            </p>
            <p className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {top.dish.name}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {top.hall.name} · {top.dish.station}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
            <p className="text-2xl font-bold">{getDishScore(list, top).toFixed(1)}</p>
            <p className="text-xs text-white/70">score</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/15 px-3 py-1">{list.length} ranked</span>
          {SENTIMENT_ORDER.map((s) => {
            const count = getSentimentGroup(list, s).length;
            return count > 0 ? (
              <span key={s} className="rounded-full bg-white/15 px-3 py-1">
                {SENTIMENT_STYLES[s].emoji} {count} {SENTIMENT_STYLES[s].heading.toLowerCase()}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {SENTIMENT_ORDER.map((s) => {
        const group = getSentimentGroup(list, s);
        if (group.length === 0) return null;
        const styles = SENTIMENT_STYLES[s];
        return (
          <section key={s} className={`mt-10 ${enter}`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              <span className="text-base">{styles.emoji}</span>
              {styles.heading}
              <span className="text-slate-300">·</span>
              {group.length}
            </h2>
            <ol className="mt-3 space-y-2">
              {group.map((item) => (
                <li
                  key={item.dish_id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <span className="w-7 shrink-0 text-center text-lg font-bold text-slate-300">
                    {item.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.dish.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <HallChip hallId={item.dish.hall_id} />
                      {item.dish.station}
                    </p>
                    {item.comment && (
                      <p className="mt-2 border-l-2 border-slate-200 pl-3 text-sm italic text-slate-600">
                        {item.comment}
                      </p>
                    )}
                  </div>
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold shadow-sm ${styles.score}`}
                  >
                    {getDishScore(list, item).toFixed(1)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <div className="mt-10 flex items-center justify-between">
        <Link href="/rank" className={primaryButton}>
          + Rank a dish
        </Link>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-slate-400 transition hover:text-slate-900"
        >
          Reset to mock data
        </button>
      </div>
    </>
  );
}

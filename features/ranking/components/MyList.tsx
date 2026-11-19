"use client";

import Link from "next/link";
import { use, useState } from "react";
import { browser } from "react-dom";
import { SENTIMENT_ORDER, getSentimentGroup } from "../insertion";
import { getCurrentUserId, getRankedDishes, resetToMockData } from "../store";
import { SENTIMENT_LABELS, listBox, primaryButton, sectionHeading } from "./styles";
import { DishMeta, Score, TextButton } from "./ui";

export default function MyList() {
  use(browser("Meals and rankings are saved in this browser's localStorage."));

  const userId = getCurrentUserId();
  const [list, setList] = useState(() => getRankedDishes(userId));

  function handleReset() {
    resetToMockData();
    setList(getRankedDishes(userId));
  }

  if (list.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="text-gray-500">Log a meal to start ranking dishes.</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Log a meal
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 space-y-6">
        {SENTIMENT_ORDER.map((s) => {
          const group = getSentimentGroup(list, s);
          if (group.length === 0) return null;
          return (
            <section key={s}>
              <h2 className={sectionHeading}>
                {SENTIMENT_LABELS[s].heading} · {group.length}
              </h2>
              <ol className={`mt-2 ${listBox}`}>
                {group.map((item) => (
                  <li key={item.dish_id} className="flex items-start gap-3 px-4 py-3">
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

      <div className="mt-8 space-y-4 text-center">
        <Link href="/dining" className={primaryButton}>
          Log a meal
        </Link>
        <TextButton onClick={handleReset}>Reset to mock data</TextButton>
      </div>
    </>
  );
}

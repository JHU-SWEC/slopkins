"use client";

import { useState } from "react";
import {
  SENTIMENT_ORDER,
  applyAnswer,
  beginSearch,
  getFinalRank,
  getMaxComparisons,
  getNextComparison,
  getSentimentGroup,
} from "../insertion";
import { mealDate, mealTitle } from "../format";
import { sentimentScore } from "../score";
import type { MealWithDishes, RankPlateInput, RankedPlate, Sentiment } from "../types";
import { SENTIMENT_LABELS, listBox, primaryButton } from "./styles";
import { Score, TextButton } from "./ui";

type Answer = { opponent: RankedPlate; newWon: boolean };

export type RankResult = Omit<RankPlateInput, "mealId">;

/**
 * Ranks one plate as a whole: verdict, then "which plate was better?" against
 * your past plates until its spot is found, then save. (Comments are written
 * when logging the meal, not here.)
 * There's no skip: every plate gets ranked. Key by meal id so state resets per plate.
 */
export function RankPlate({
  meal,
  list,
  onRank,
}: {
  meal: MealWithDishes;
  /** The user's ranked plates, best first. */
  list: RankedPlate[];
  onRank: (result: RankResult) => void;
}) {
  const others = list.filter((item) => item.meal_id !== meal.id);

  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const frame = (body: React.ReactNode) => (
    <div className="mt-6">
      <p className="text-sm text-gray-500">{mealDate(meal.created_at)}</p>
      <h2 className="mt-2 text-xl font-semibold">{mealTitle(meal)}</h2>
      <DishNames names={meal.dishes.map((row) => row.dish.name)} />
      {body}
    </div>
  );

  if (!sentiment) {
    return frame(
      <>
        <p className="mt-6 font-semibold">How was this plate?</p>
        <ul className={`mt-2 ${listBox}`}>
          {SENTIMENT_ORDER.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setSentiment(s)}
                className="flex w-full items-center justify-between px-4 py-3 text-left font-medium transition hover:bg-gray-50"
              >
                {SENTIMENT_LABELS[s].prompt}
                <span className="text-gray-300">›</span>
              </button>
            </li>
          ))}
        </ul>
      </>,
    );
  }

  // Replay the answers so far to find where the search stands.
  const group = getSentimentGroup(others, sentiment);
  const range = answers.reduce((current, answer) => applyAnswer(current, answer.newWon), beginSearch(group));
  const opponent = getNextComparison(group, range);

  function goBack() {
    if (answers.length > 0) setAnswers(answers.slice(0, -1));
    else setSentiment(null);
  }
  const back = (
    <div className="mt-4">
      <TextButton onClick={goBack}>‹ {answers.length > 0 ? "Undo last answer" : "Change your verdict"}</TextButton>
    </div>
  );

  if (opponent) {
    const answer = (newWon: boolean) => setAnswers([...answers, { opponent, newWon }]);
    return frame(
      <>
        <div className="mt-6 flex items-baseline justify-between gap-4">
          <p className="font-semibold">Which plate was better?</p>
          <span className="text-sm text-gray-400">
            {answers.length + 1} of at most {getMaxComparisons(group)}
          </span>
        </div>
        <ul className={`mt-2 ${listBox}`}>
          <Choice
            title={mealTitle(meal)}
            date={mealDate(meal.created_at)}
            names={meal.dishes.map((row) => row.dish.name)}
            label="This plate"
            onClick={() => answer(true)}
          />
          <Choice
            title={mealTitle(opponent)}
            date={mealDate(opponent.created_at)}
            names={opponent.dish_names}
            label={`#${opponent.rank} on your list`}
            onClick={() => answer(false)}
          />
        </ul>
        {back}
      </>,
    );
  }

  const position = range.low;
  const rank = getFinalRank(others, sentiment, position);
  const score = sentimentScore(sentiment, position, group.length + 1);

  function save() {
    if (!sentiment) return;
    onRank({ sentiment, position, comment: null });
  }

  return frame(
    <>
      <p className="mt-6 text-gray-700">
        Lands at #{rank} on your list (<Score score={score} />).
      </p>
      <button type="button" onClick={save} className={`mt-4 ${primaryButton}`}>
        Save ranking
      </button>
      {back}
    </>,
  );
}

/** What was on the plate, as small gray tags. */
export function DishNames({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {names.map((name, index) => (
        <li key={`${name}-${index}`} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-700">
          {name}
        </li>
      ))}
    </ul>
  );
}

function Choice({
  title,
  date,
  names,
  label,
  onClick,
}: {
  title: string;
  date: string;
  names: string[];
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <span className="min-w-0">
          <span className="block font-medium">
            {title} <span className="font-normal text-gray-500">· {date}</span>
          </span>
          <span className="mt-0.5 block text-sm text-gray-500">{names.join(", ")}</span>
        </span>
        <span className="shrink-0 text-xs text-gray-400">{label}</span>
      </button>
    </li>
  );
}

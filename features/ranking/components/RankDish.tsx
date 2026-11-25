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
import { sentimentScore } from "../score";
import type { Dish, RankDishInput, RankedDish, Sentiment } from "../types";
import { SENTIMENT_LABELS, listBox, primaryButton, secondaryButton } from "./styles";
import { DishMeta, Score, TextButton } from "./ui";

type Answer = { opponent: RankedDish; newDishWon: boolean };

export type RankResult = Omit<RankDishInput, "mealId">;

/**
 * Ranks one dish: verdict, then "which is better?" until its spot is found,
 * then an optional comment. Skip is available at every step.
 * Key this component by dish id so its state resets per dish.
 */
export function RankDish({
  dish,
  list,
  progress,
  onRank,
  onKeep,
  onSkip,
}: {
  dish: Dish;
  /** The user's current list, best first. */
  list: RankedDish[];
  /** e.g. "FFC lunch · 1 of 3" */
  progress: string;
  onRank: (result: RankResult) => void;
  /** Already on the list and the user doesn't want to move it. */
  onKeep: () => void;
  onSkip: () => void;
}) {
  const existing = list.find((item) => item.dish_id === dish.id) ?? null;
  const others = list.filter((item) => item.dish_id !== dish.id);

  const [reranking, setReranking] = useState(false);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [comment, setComment] = useState("");

  const frame = (body: React.ReactNode) => (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4 text-sm text-gray-500">
        <span>{progress}</span>
        <TextButton onClick={onSkip}>Skip</TextButton>
      </div>
      <h2 className="mt-2 text-xl font-semibold">{dish.name}</h2>
      <DishMeta dish={dish} />
      {body}
    </div>
  );

  // Already ranked: default to keeping it, so re-logging a favorite is one tap.
  if (existing && !reranking) {
    return frame(
      <>
        <p className="mt-6 text-gray-700">
          Already #{existing.rank} on your list (<Score score={existing.score} />).
        </p>
        <div className="mt-4 space-y-2">
          <button type="button" onClick={onKeep} className={primaryButton}>
            Keep it there
          </button>
          <button type="button" onClick={() => setReranking(true)} className={secondaryButton}>
            Re-rank
          </button>
        </div>
      </>,
    );
  }

  if (!sentiment) {
    return frame(
      <>
        <p className="mt-6 font-semibold">How was it?</p>
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
        {existing && (
          <div className="mt-4">
            <TextButton onClick={() => setReranking(false)}>‹ Keep it at #{existing.rank}</TextButton>
          </div>
        )}
      </>,
    );
  }

  // Replay the answers so far to find where the search stands.
  const group = getSentimentGroup(others, sentiment);
  const range = answers.reduce(
    (current, answer) => applyAnswer(current, answer.newDishWon),
    beginSearch(group),
  );
  const opponent = getNextComparison(group, range);

  function goBack() {
    if (answers.length > 0) setAnswers(answers.slice(0, -1));
    else setSentiment(null);
  }
  const back = (
    <div className="mt-4">
      <TextButton onClick={goBack}>
        ‹ {answers.length > 0 ? "Undo last answer" : "Change your verdict"}
      </TextButton>
    </div>
  );

  if (opponent) {
    const answer = (newDishWon: boolean) => setAnswers([...answers, { opponent, newDishWon }]);
    return frame(
      <>
        <div className="mt-6 flex items-baseline justify-between gap-4">
          <p className="font-semibold">Which was better?</p>
          <span className="text-sm text-gray-400">
            {answers.length + 1} of at most {getMaxComparisons(group)}
          </span>
        </div>
        <ul className={`mt-2 ${listBox}`}>
          <Choice dish={dish} label="This meal" onClick={() => answer(true)} />
          <Choice
            dish={opponent.dish}
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
    onRank({
      dishId: dish.id,
      sentiment,
      position,
      comment: comment.trim() || null,
      comparisons: answers.map(({ opponent, newDishWon }) =>
        newDishWon
          ? { winner_dish_id: dish.id, loser_dish_id: opponent.dish_id }
          : { winner_dish_id: opponent.dish_id, loser_dish_id: dish.id },
      ),
    });
  }

  return frame(
    <>
      <p className="mt-6 text-gray-700">
        Lands at #{rank} on your list (<Score score={score} />).
      </p>
      <label htmlFor={`comment-${dish.id}`} className="mt-4 block text-sm font-semibold">
        Comment <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <textarea
        id={`comment-${dish.id}`}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        placeholder={existing?.comment ?? "What made it good or bad?"}
        className="mt-2 w-full resize-none rounded-md border border-gray-200 p-3 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
      />
      <button type="button" onClick={save} className={`mt-3 ${primaryButton}`}>
        Save ranking
      </button>
      {back}
    </>,
  );
}

function Choice({ dish, label, onClick }: { dish: Dish; label: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <span className="min-w-0">
          <span className="block font-medium">{dish.name}</span>
          <DishMeta dish={dish} />
        </span>
        <span className="shrink-0 text-xs text-gray-400">{label}</span>
      </button>
    </li>
  );
}

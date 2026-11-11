"use client";

import Link from "next/link";
import { use, useState } from "react";
import { browser } from "react-dom";
import {
  SENTIMENT_ORDER,
  applyAnswer,
  beginSearch,
  getFinalRank,
  getMaxComparisons,
  getNextComparison,
  getSentimentGroup,
  insertDish,
} from "../insertion";
import { getDishScore } from "../score";
import {
  getCurrentUserId,
  getDiningHall,
  getDiningHalls,
  getRankedDishes,
  getUnrankedDishes,
  saveRanking,
} from "../store";
import type { DiningHallId, Dish, RankedDish, Sentiment } from "../types";
import {
  BRAND_BG,
  HALL_STYLES,
  SENTIMENT_STYLES,
  enter,
  primaryButton,
  secondaryButton,
} from "./styles";

type Answer = { opponent: RankedDish; newDishWon: boolean };
type Saved = { dish: Dish; sentiment: Sentiment; rank: number; score: number };

const STEPS = ["Dish", "Verdict", "Compare", "Save"];

export default function RankFlow() {
  use(browser("Rankings are saved in this browser's localStorage."));

  const userId = getCurrentUserId();
  const [myList, setMyList] = useState(() => getRankedDishes(userId));
  const [unranked, setUnranked] = useState(() => getUnrankedDishes(userId));
  const [dish, setDish] = useState<Dish | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);

  function startOver() {
    setDish(null);
    setSentiment(null);
    setAnswers([]);
    setComment("");
  }

  if (saved) {
    return (
      <Card key="saved">
        <div className="text-center">
          <div className="text-5xl">🎉</div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Added to your list
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {saved.dish.name} is #{saved.rank}
          </p>
          <div className="mt-3 flex justify-center">
            <ScorePill sentiment={saved.sentiment} score={saved.score} />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/my-list" className={primaryButton}>
              View my list
            </Link>
            <button type="button" onClick={() => setSaved(null)} className={secondaryButton}>
              Rank another dish
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!dish) {
    return (
      <>
        <Progress step={0} />
        <PickDish dishes={unranked} onPick={setDish} />
      </>
    );
  }

  if (!sentiment) {
    return (
      <>
        <Progress step={1} />
        <Card key="sentiment">
          <SelectedDish dish={dish} />
          <h2 className="mt-6 text-xl font-semibold">How was it?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {SENTIMENT_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSentiment(s)}
                className={`rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${SENTIMENT_STYLES[s].choice}`}
              >
                <span className="text-3xl">{SENTIMENT_STYLES[s].emoji}</span>
                <span className="mt-3 block font-semibold">{SENTIMENT_STYLES[s].prompt}</span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  {SENTIMENT_STYLES[s].description}
                </span>
              </button>
            ))}
          </div>
          <BackButton onClick={() => setDish(null)}>Pick a different dish</BackButton>
        </Card>
      </>
    );
  }

  // Replay the answers so far to find where the search stands.
  const group = getSentimentGroup(myList, sentiment);
  const range = answers.reduce(
    (current, answer) => applyAnswer(current, answer.newDishWon),
    beginSearch(group),
  );
  const opponent = getNextComparison(group, range);

  function goBack() {
    if (answers.length > 0) setAnswers(answers.slice(0, -1));
    else setSentiment(null);
  }
  const backLabel = answers.length > 0 ? "Undo last answer" : "Change your verdict";

  if (opponent) {
    const answer = (newDishWon: boolean) =>
      setAnswers([...answers, { opponent, newDishWon }]);

    return (
      <>
        <Progress step={2} />
        <Card key={`compare-${answers.length}`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Which is better?</h2>
            <span className="shrink-0 text-sm text-slate-400">
              {answers.length + 1} of at most {getMaxComparisons(group)}
            </span>
          </div>
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
            <ChoiceCard dish={dish} tag="New" onClick={() => answer(true)} />
            <ChoiceCard
              dish={opponent.dish}
              tag={`#${opponent.rank} on your list`}
              onClick={() => answer(false)}
            />
            <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-slate-900 text-xs font-bold text-white">
              VS
            </span>
          </div>
          <BackButton onClick={goBack}>{backLabel}</BackButton>
        </Card>
      </>
    );
  }

  const rank = getFinalRank(myList, sentiment, range.low);
  const preview: RankedDish = {
    user_id: userId,
    dish_id: dish.id,
    rank,
    sentiment,
    comment: null,
    created_at: "",
    dish,
    hall: getDiningHall(dish.hall_id),
  };
  const score = getDishScore(insertDish(myList, preview), preview);

  function handleSave() {
    if (!dish || !sentiment) return;
    saveRanking({
      userId,
      dish,
      sentiment,
      rank,
      comment: comment.trim() || null,
      answers: answers.map(({ opponent, newDishWon }) =>
        newDishWon
          ? { winner_dish_id: dish.id, loser_dish_id: opponent.dish_id }
          : { winner_dish_id: opponent.dish_id, loser_dish_id: dish.id },
      ),
    });
    setSaved({ dish, sentiment, rank, score });
    setMyList(getRankedDishes(userId));
    setUnranked(getUnrankedDishes(userId));
    startOver();
  }

  return (
    <>
      <Progress step={3} />
      <Card key="save">
        <div className="flex items-center gap-4">
          <div
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white ${BRAND_BG}`}
          >
            #{rank}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Lands on your list at</p>
            <p className="truncate text-xl font-semibold">{dish.name}</p>
          </div>
          <div className="ml-auto">
            <ScorePill sentiment={sentiment} score={score} />
          </div>
        </div>

        <label htmlFor="comment" className="mt-8 block text-sm font-semibold">
          Leave a comment <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder="What made it good or bad?"
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 transition placeholder:text-slate-400 focus:border-[#002D72] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#002D72]/10"
        />
        <button type="button" onClick={handleSave} className={`mt-4 w-full ${primaryButton}`}>
          Save to my list
        </button>
        <BackButton onClick={goBack}>{backLabel}</BackButton>
      </Card>
    </>
  );
}

function PickDish({ dishes, onPick }: { dishes: Dish[]; onPick: (dish: Dish) => void }) {
  const [query, setQuery] = useState("");
  const [hallFilter, setHallFilter] = useState<DiningHallId | "all">("all");

  if (dishes.length === 0) {
    return (
      <Card key="all-ranked">
        <div className="text-center">
          <div className="text-4xl">🏆</div>
          <p className="mt-3 font-semibold">You&apos;ve ranked every dish.</p>
          <Link href="/my-list" className={`mt-6 ${primaryButton}`}>
            View my list
          </Link>
        </div>
      </Card>
    );
  }

  const search = query.trim().toLowerCase();
  const matches = dishes.filter(
    (d) =>
      (hallFilter === "all" || d.hall_id === hallFilter) &&
      (d.name.toLowerCase().includes(search) || d.station.toLowerCase().includes(search)),
  );
  const filters: { id: DiningHallId | "all"; label: string }[] = [
    { id: "all", label: "All halls" },
    ...getDiningHalls().map((hall) => ({ id: hall.id, label: hall.name })),
  ];

  return (
    <Card key="pick">
      <h2 className="text-xl font-semibold">What did you eat?</h2>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search dishes or stations"
        className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition placeholder:text-slate-400 focus:border-[#002D72] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#002D72]/10"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setHallFilter(filter.id)}
            className={
              hallFilter === filter.id
                ? `rounded-full px-3.5 py-1.5 text-sm font-medium text-white ${BRAND_BG}`
                : "rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {matches.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">No dishes match that search.</p>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {matches.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onPick(d)}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#002D72]/30 hover:shadow-md active:scale-[0.98]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{d.name}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <HallChip hallId={d.hall_id} />
                    {d.station}
                  </span>
                </span>
                <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#002D72]">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <ol className="mt-8 grid grid-cols-4 gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
      {STEPS.map((label, i) => (
        <li key={label}>
          <div
            className={`h-1.5 rounded-full transition-colors duration-500 ${i <= step ? BRAND_BG : "bg-slate-200"}`}
          />
          <p
            className={`mt-2 text-xs font-medium ${i <= step ? "text-slate-900" : "text-slate-400"}`}
          >
            {label}
          </p>
        </li>
      ))}
    </ol>
  );
}

function SelectedDish({ dish }: { dish: Dish }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <span className="text-sm text-slate-500">Ranking</span>
      <span className="font-semibold">{dish.name}</span>
      <HallChip hallId={dish.hall_id} />
    </div>
  );
}

function ChoiceCard({ dish, tag, onClick }: { dish: Dish; tag: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-40 flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-[#002D72] hover:shadow-lg active:scale-[0.98]"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{tag}</span>
      <span>
        <span className="block text-xl font-bold tracking-tight">{dish.name}</span>
        <span className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <HallChip hallId={dish.hall_id} />
          {dish.station}
        </span>
      </span>
    </button>
  );
}

export function HallChip({ hallId }: { hallId: DiningHallId }) {
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${HALL_STYLES[hallId]}`}>
      {getDiningHall(hallId).name}
    </span>
  );
}

export function ScorePill({ sentiment, score }: { sentiment: Sentiment; score: number }) {
  const styles = SENTIMENT_STYLES[sentiment];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}>
      {styles.emoji} {score.toFixed(1)}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 ${enter}`}
    >
      {children}
    </div>
  );
}

function BackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 text-sm font-medium text-slate-400 transition hover:text-slate-900"
    >
      ← {children}
    </button>
  );
}

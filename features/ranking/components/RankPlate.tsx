"use client";

import Image, { getImageProps } from "next/image";
import { startTransition, useEffect, useState, ViewTransition } from "react";
import {
  SENTIMENT_ORDER,
  applyAnswer,
  beginSearch,
  getMaxComparisons,
  getNextComparison,
  getSentimentGroup,
} from "../insertion";
import { mealDate, mealTitle } from "../format";
import { mealPhotoSrc } from "../photo";
import type { MealWithDishes, RankPlateInput, RankedPlate, Sentiment } from "../types";
import { SENTIMENT_LABELS, SENTIMENT_STYLES, primaryButton } from "./styles";
import { TextButton } from "./ui";

type Answer = { opponent: RankedPlate; newWon: boolean };

/**
 * One image size for every plate card in the rank flow (cards are at most
 * 320px wide), so a photo is the same file on every step and stays cached.
 * React holds each step's animation until new images load (up to ~0.8s), so a
 * photo that has to load again makes every tap feel slow.
 */
const CARD_PHOTO_SIZES = "320px";

/** Starts downloading a plate's photo now, so its card shows instantly later. */
function preloadPhoto(path: string) {
  const { props } = getImageProps({ src: mealPhotoSrc(path), alt: "", fill: true, sizes: CARD_PHOTO_SIZES });
  const img = new window.Image();
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
}

// Verdict buttons get a faint tint of their color, stronger on hover. Dark mode
// uses deep borders (the -50 backgrounds already go dark in globals.css).
const VERDICT_TINTS: Record<Sentiment, string> = {
  liked: "border-emerald-200 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-900 dark:hover:border-emerald-700",
  fine: "border-amber-200 bg-amber-50 hover:border-amber-400 dark:border-amber-900 dark:hover:border-amber-700",
  disliked: "border-rose-200 bg-rose-50 hover:border-rose-400 dark:border-rose-900 dark:hover:border-rose-700",
};

export type RankResult = Omit<RankPlateInput, "mealId">;

/**
 * Ranks one plate as a whole: verdict, then "which plate was better?" against
 * your past plates. It saves the moment the plate's spot is found; there's no
 * separate save step. Comments are written when logging the meal, not here.
 * There's no skip: every plate gets ranked. Key by meal id so state resets per plate.
 */
export function RankPlate({
  meal,
  list,
  onRank,
  failed = false,
}: {
  meal: MealWithDishes;
  /** The user's ranked plates, best first. */
  list: RankedPlate[];
  onRank: (result: RankResult) => void;
  /** The last save failed: show a retry instead of "Saving…". */
  failed?: boolean;
}) {
  const others = list.filter((item) => item.meal_id !== meal.id);

  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  /** Where the answers so far leave the search in this sentiment's group. */
  function searchState(s: Sentiment, given: Answer[]) {
    const group = getSentimentGroup(others, s);
    const range = given.reduce((current, a) => applyAnswer(current, a.newWon), beginSearch(group));
    return { group, range, opponent: getNextComparison(group, range) };
  }

  /** Saves as soon as the plate's spot is known; there's no separate save step. */
  function finishIfPlaced(s: Sentiment, given: Answer[]) {
    const { range, opponent } = searchState(s, given);
    if (!opponent) onRank({ sentiment: s, position: range.low, comment: null });
  }

  // Preload the photos that could show next: on the verdict step, each
  // verdict's first opponent; in comparisons, the next opponent for either answer.
  const upcoming: (RankedPlate | null)[] = !sentiment
    ? SENTIMENT_ORDER.map((s) => searchState(s, []).opponent)
    : (() => {
        const current = searchState(sentiment, answers).opponent;
        if (!current) return [];
        return [true, false].map(
          (newWon) => searchState(sentiment, [...answers, { opponent: current, newWon }]).opponent,
        );
      })();
  const upcomingPhotos = upcoming.flatMap((plate) => (plate?.photo_path ? [plate.photo_path] : []));
  const upcomingKey = upcomingPhotos.join("|");
  useEffect(() => {
    if (upcomingKey) upcomingKey.split("|").forEach(preloadPhoto);
  }, [upcomingKey]);

  // Every step change runs in a transition, so the <ViewTransition>s animate it:
  // your plate's card glides between steps, opponents slide in and out.
  function pickVerdict(s: Sentiment) {
    startTransition(() => setSentiment(s));
    // Nothing to compare against: saves right away.
    finishIfPlaced(s, []);
  }

  // Your plate's card, the same element on every step (and on the summary).
  const myCard = (props: { label?: string; onClick?: () => void }) => (
    <MyPlateCard meal={meal} {...props} />
  );

  if (!sentiment) {
    // The plate up top, then three big verdict buttons, like Beli.
    return (
      <div className="mt-6 flex flex-col items-center">
        <div className="w-full max-w-[240px]">{myCard({})}</div>
        <ViewTransition exit="fade-out" default="none">
          <div className="w-full">
            <p className="mt-6 text-center text-lg font-semibold">How was it?</p>
            <div className="mt-3 grid w-full grid-cols-3 gap-3">
              {SENTIMENT_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickVerdict(s)}
                  className={`group flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95 motion-reduce:transform-none ${VERDICT_TINTS[s]}`}
                >
                  <span
                    className={`grid size-14 place-items-center rounded-full transition group-hover:scale-110 motion-reduce:transform-none ${SENTIMENT_STYLES[s].score}`}
                  >
                    <Face sentiment={s} />
                  </span>
                  <span className="text-sm font-semibold">{SENTIMENT_LABELS[s].prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </ViewTransition>
      </div>
    );
  }

  // Replay the answers so far to find where the search stands.
  const { group, range, opponent } = searchState(sentiment, answers);

  function goBack() {
    // Undoing an answer just swaps the opponent back (instant); changing the
    // verdict glides your card back to the center.
    if (answers.length > 0) setAnswers(answers.slice(0, -1));
    else startTransition(() => setSentiment(null));
  }
  const back = (
    <div className="mt-4">
      <TextButton onClick={goBack}>‹ {answers.length > 0 ? "Undo last answer" : "Change your verdict"}</TextButton>
    </div>
  );

  if (opponent) {
    const answer = (newWon: boolean) => {
      const next = [...answers, { opponent, newWon }];
      if (searchState(sentiment, next).opponent) {
        // Another question: a plain update, so the next opponent shows the
        // instant you tap. (A view transition here would hold the tap until the
        // new photo loads, up to ~0.8s.)
        setAnswers(next);
      } else {
        // Last answer: glide your card to the center while it saves.
        startTransition(() => setAnswers(next));
        finishIfPlaced(sentiment, next);
      }
    };
    // Binary search can finish early, so the count is an upper bound.
    const most = getMaxComparisons(group);
    const question = answers.length + 1;
    return (
      <div className="mt-6">
        <ViewTransition enter="fade-in" default="none">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-semibold">Which plate was better?</p>
              <span className="text-sm text-gray-400 tabular-nums">
                {question} of {question === most ? most : `up to ${most}`}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Comparisons"
              aria-valuemin={0}
              aria-valuemax={most}
              aria-valuenow={answers.length}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${(answers.length / most) * 100}%` }}
              />
            </div>
          </div>
        </ViewTransition>

        {/* Side by side on every screen, like Beli: tap the better plate. */}
        <div className="relative mt-4 grid grid-cols-2 gap-3">
          {myCard({ label: "This plate", onClick: () => answer(true) })}
          {/* Keyed by opponent: each new one slides in with plain CSS, which never waits. */}
          <div
            key={opponent.meal_id}
            className="flex min-w-0 transition duration-300 ease-out starting:translate-x-6 starting:opacity-0 motion-reduce:transition-none"
          >
            <PlateCard
              title={mealTitle(opponent)}
              date={mealDate(opponent.created_at)}
              names={opponent.dish_names}
              photoPath={opponent.photo_path}
              label={`#${opponent.rank} on your list`}
              onClick={() => answer(false)}
            />
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[calc(50%-1.5rem)] grid size-9 -translate-x-1/2 place-items-center rounded-full border border-gray-200 bg-white text-xs font-bold uppercase text-gray-500 shadow-sm sm:top-[calc(50%-2rem)]"
          >
            or
          </span>
        </div>
        {back}
      </div>
    );
  }

  // The spot is found and the save is on its way (finish already sent it).
  // The card moves back to the center; on success the summary takes over with
  // the same card, on failure retry here.
  return (
    <div className="mt-6 flex flex-col items-center">
      <div className="w-full max-w-xs">{myCard({})}</div>
      {failed ? (
        <div className="w-full">
          <button
            type="button"
            onClick={() => onRank({ sentiment, position: range.low, comment: null })}
            className={`mt-6 ${primaryButton}`}
          >
            Try again
          </button>
          {back}
        </div>
      ) : (
        <p role="status" className="mt-6 text-gray-500">
          Saving your ranking…
        </p>
      )}
    </div>
  );
}

/**
 * The view transition name that ties your plate's card together across steps.
 * One plate is ranked at a time, and a draft's id changes when it's saved, so
 * the name doesn't include the id.
 */
const MY_PLATE_TRANSITION = "rank-my-plate";

/**
 * Your plate's card, wrapped so it morphs between steps: centered on the
 * verdict step, the left slot in comparisons, centered again on the summary.
 */
export function MyPlateCard({
  meal,
  label,
  onClick,
  corner,
}: {
  meal: MealWithDishes;
  label?: string;
  onClick?: () => void;
  corner?: React.ReactNode;
}) {
  return (
    <ViewTransition name={MY_PLATE_TRANSITION} share="morph" default="none">
      <div className="flex min-w-0">
        <PlateCard
          title={mealTitle(meal)}
          date={mealDate(meal.created_at)}
          names={meal.dishes.map((row) => row.dish.name)}
          photoPath={meal.photo_path}
          label={label}
          highlight
          corner={corner}
          onClick={onClick}
        />
      </div>
    </ViewTransition>
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

/**
 * A plate as a card: photo on top, then what it was. With `onClick` it's a
 * button (one side of "which plate was better?"); without, it just shows the
 * plate (the result screen).
 */
export function PlateCard({
  title,
  date,
  names,
  photoPath,
  label,
  highlight = false,
  corner,
  sizes = CARD_PHOTO_SIZES,
  onClick,
}: {
  title: string;
  date: string;
  names: string[];
  photoPath: string | null;
  /** Tag on the photo's top-left, e.g. "This plate". */
  label?: string;
  /** The plate being ranked gets a brand-colored label. */
  highlight?: boolean;
  /** Pinned to the photo's bottom-right corner, e.g. the score. */
  corner?: React.ReactNode;
  /** Image sizes hint; keep the default so every step loads the same file. */
  sizes?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="relative block aspect-square w-full overflow-hidden bg-gray-100">
        {photoPath ? (
          <Image
            src={mealPhotoSrc(photoPath)}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <NoPhoto title={title} />
        )}
        {label && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm ${
              highlight ? "bg-brand text-on-brand" : "bg-white/80 text-gray-700 backdrop-blur-sm"
            }`}
          >
            {label}
          </span>
        )}
        {corner && <span className="absolute bottom-3 right-3">{corner}</span>}
      </span>
      <span className="block p-3">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block text-xs text-gray-500">{date}</span>
        <span className="mt-1 line-clamp-2 text-sm text-gray-600">{names.join(", ")}</span>
      </span>
    </>
  );

  const card = "flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left";
  if (!onClick) return <div className={card}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label ? `${label}: ` : ""}${title}, ${date}. ${names.join(", ")}`}
      className={`group ${card} transition hover:border-brand hover:shadow-md focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]`}
    >
      {body}
    </button>
  );
}

/** Stands in for a missing photo: a fork and knife over the hall's name. */
function NoPhoto({ title }: { title: string }) {
  return (
    <span className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-10"
      >
        <path d="M4 3v5a3 3 0 0 0 6 0V3" />
        <path d="M7 3v18" />
        <path d="M17 21V3a4 4 0 0 0-3 4v6a1 1 0 0 0 1 1h2" />
      </svg>
      <span className="px-2 text-center text-xs font-medium">{title.split(" · ")[0]}</span>
    </span>
  );
}

/** A simple face for each verdict: smile, straight mouth, frown. */
function Face({ sentiment }: { sentiment: Sentiment }) {
  const mouth = {
    liked: "M8 14.5s1.5 2 4 2 4-2 4-2",
    fine: "M8.5 15.5h7",
    disliked: "M16 16.5s-1.5-2-4-2-4 2-4 2",
  }[sentiment];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-8"
    >
      <path d="M9 9.5v.5" />
      <path d="M15 9.5v.5" />
      <path d={mouth} />
    </svg>
  );
}

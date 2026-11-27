"use client";

import Link from "next/link";
import { startTransition, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { logAndRankMealAction, rankPlateAction, rerankPlateAction, type ActionResult } from "../actions";
import { clearDraft, draftAsMeal, parseDraft, readDraftRaw } from "../draft";
import { mealTitle } from "../format";
import type { MealWithDishes, RankedPlate } from "../types";
import { formatScore } from "../score";
import { Confetti } from "./Confetti";
import { DishNames, MyPlateCard, RankPlate, type RankResult } from "./RankPlate";
import { SENTIMENT_LABELS, SENTIMENT_STYLES, primaryButton, secondaryButton } from "./styles";

/**
 * Ranking for one logged meal: the plate as a whole, then a summary.
 * `meal` and `list` come from the server; each action re-renders the page with fresh data.
 */
export default function RankMeal({ meal, list }: { meal: MealWithDishes; list: RankedPlate[] }) {
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Ranked on this visit (not an old link to a ranked plate), so it's worth celebrating.
  const [justRanked, setJustRanked] = useState(false);

  function run(action: () => Promise<ActionResult>, onDone?: () => void) {
    setError(null);
    startSaving(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onDone?.();
    });
  }

  // The plate waits in the queue while any of its dishes is pending.
  const waiting = meal.dishes.some((row) => row.rank_status === "pending");
  const errorLine = error && (
    <p role="alert" className="mt-4 text-sm text-red-600">
      {error}
    </p>
  );

  if (!waiting) {
    return (
      <>
        <Summary
          meal={meal}
          list={list}
          celebrate={justRanked}
          onRank={() => run(() => rerankPlateAction(meal.id))}
        />
        {errorLine}
      </>
    );
  }

  return (
    // Ignore taps while a save is on its way, so a plate isn't saved twice.
    <div aria-busy={saving} className={saving ? "pointer-events-none opacity-60" : undefined}>
      <RankPlate
        key={meal.id}
        meal={meal}
        list={list}
        onRank={(result) =>
          run(
            () => rankPlateAction({ ...result, mealId: meal.id }),
            () => setJustRanked(true),
          )
        }
        failed={error !== null}
      />
      {errorLine}
    </div>
  );
}

/**
 * Ranking for a meal picked on the menu but not saved yet (see draft.ts). The
 * meal and its ranking are saved together on the last answer, so it's never
 * posted unranked; leaving before then saves nothing.
 */
export function RankDraft({ list }: { list: RankedPlate[] }) {
  // sessionStorage only exists in the browser; the server renders "loading".
  const raw = useSyncExternalStore(noSubscribe, readDraftRaw, () => undefined);
  const draft = useMemo(() => (raw === undefined ? undefined : parseDraft(raw)), [raw]);

  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ meal: MealWithDishes; list: RankedPlate[] } | null>(null);

  if (saved) {
    return <Summary meal={saved.meal} list={saved.list} celebrate onRank={() => {}} />;
  }
  if (draft === undefined) {
    return <div className="mt-6 h-72 animate-pulse rounded-3xl bg-gray-100" />;
  }
  if (draft === null) {
    return (
      <div className="mt-6">
        <p className="text-gray-500">There&apos;s no meal to rank. Pick what you ate on a dining hall&apos;s menu.</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Log a meal
        </Link>
      </div>
    );
  }

  const meal = draftAsMeal(draft);
  function save(result: RankResult) {
    if (!draft) return;
    setError(null);
    startSaving(async () => {
      const response = await logAndRankMealAction({
        hallSlug: draft.hallSlug,
        menuTypeSlug: draft.menuTypeSlug,
        foodIds: draft.foodIds,
        photoPath: draft.photoPath,
        caption: draft.caption,
        sentiment: result.sentiment,
        position: result.position,
      });
      if (response.error || !response.mealId || !response.list) {
        setError(response.error ?? "Couldn't save your meal. Please try again.");
        return;
      }
      clearDraft();
      // Updates after an await need their own transition, so the card glides to the summary.
      const done = { meal: draftAsMeal(draft, response.mealId), list: response.list };
      startTransition(() => setSaved(done));
    });
  }

  return (
    // Ignore taps while a save is on its way, so a meal isn't saved twice.
    <div aria-busy={saving} className={saving ? "pointer-events-none opacity-60" : undefined}>
      <RankPlate meal={meal} list={list} onRank={save} failed={error !== null} />
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// The draft only changes from this tab's own code, never under us.
function noSubscribe() {
  return () => {};
}

/**
 * A headline for a big moment, or null for an ordinary plate. Top spots only
 * count for liked plates (a "#1" of all disliked plates isn't a win).
 */
function milestone(ranking: RankedPlate, total: number): string | null {
  if (total === 1) return "Your first ranked plate!";
  if (ranking.sentiment !== "liked") return null;
  if (ranking.rank === 1) return "New #1 plate!";
  if (ranking.rank <= 3) return "Top 3!";
  return null;
}

function Summary({
  meal,
  list,
  celebrate,
  onRank,
}: {
  meal: MealWithDishes;
  list: RankedPlate[];
  /** Ranked just now, so a big moment gets confetti. */
  celebrate: boolean;
  onRank: () => void;
}) {
  const ranking = list.find((item) => item.meal_id === meal.id);
  const headline = ranking && celebrate ? milestone(ranking, list.length) : null;

  return (
    <div className="mt-6">
      {headline && <Confetti />}
      {ranking ? (
        // The reveal: the plate's card, with its score popping in on the photo.
        <div className="flex flex-col items-center text-center">
          {headline && (
            <p className="mb-2 text-2xl font-extrabold tracking-tight text-brand transition duration-500 ease-out starting:scale-75 starting:opacity-0 motion-reduce:transition-none">
              {headline}
            </p>
          )}
          <h2 className="text-xl font-semibold">
            #{ranking.rank} of {list.length} on your list
          </h2>
          <p className="mt-1 text-sm text-gray-500">{SENTIMENT_LABELS[ranking.sentiment].heading}</p>
          {/* The same card as on the ranking steps, so it glides into place here. */}
          <div className="mt-4 w-full max-w-xs">
            <MyPlateCard
              meal={meal}
              label="This plate"
              corner={
                <span
                  role="img"
                  aria-label={`Plate score ${formatScore(ranking.score)} out of 10`}
                  className={`grid size-16 place-items-center rounded-full border-[3px] border-current bg-white text-xl font-bold tracking-tight tabular-nums shadow-lg transition delay-300 duration-500 ease-out starting:scale-0 starting:opacity-0 motion-reduce:transition-none ${
                    SENTIMENT_STYLES[ranking.sentiment].number
                  }`}
                >
                  {formatScore(ranking.score)}
                </span>
              }
            />
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{mealTitle(meal)}</p>
          <h2 className="mt-1 text-xl font-semibold">Meal logged</h2>
          <DishNames names={meal.dishes.map((row) => row.dish.name)} />
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 px-4 py-3">
            <span className="text-gray-500">Not ranked</span>
            <button
              type="button"
              onClick={onRank}
              className="text-sm font-semibold text-brand hover:text-brand/80"
            >
              Rank it
            </button>
          </div>
        </>
      )}

      <div className="mt-6 space-y-2">
        <Link href="/profile#ranked" className={primaryButton}>
          View my ranked plates
        </Link>
        <Link href="/feed" className={secondaryButton}>
          Done
        </Link>
      </div>
    </div>
  );
}

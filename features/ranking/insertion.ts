// Binary insertion into a sentiment group. The client asks "which is better?"
// against the middle of the remaining range until one spot is left, then
// sends that position to rank_plate.

import type { Sentiment } from "./types";

/** Anything on a ranked list. */
type Ranked = { sentiment: Sentiment; score: number };

/** Sentiment groups in list order: liked first, disliked last. */
export const SENTIMENT_ORDER: Sentiment[] = ["liked", "fine", "disliked"];

/** A sentiment group, best first. */
export function getSentimentGroup<T extends Ranked>(items: T[], s: Sentiment): T[] {
  return items.filter((item) => item.sentiment === s).sort((a, b) => b.score - a.score);
}

/** The positions in a sentiment group where the new item could still go. */
export type SearchRange = {
  low: number;
  high: number;
};

/** The range before any questions: low is 0 and high is the group's size. */
export function beginSearch(group: Ranked[]): SearchRange {
  return { low: 0, high: group.length };
}

/** The position halfway through the range: floor((low + high) / 2). */
export function getMiddle(range: SearchRange): number {
  return Math.floor((range.low + range.high) / 2);
}

/** The item to compare against next, or null once low equals high. */
export function getNextComparison<T extends Ranked>(group: T[], range: SearchRange): T | null {
  if (range.low >= range.high) return null;
  return group[getMiddle(range)];
}

/** The narrowed range: high = middle if the new item won, otherwise low = middle + 1. */
export function applyAnswer(range: SearchRange, newWon: boolean): SearchRange {
  const middle = getMiddle(range);
  return newWon ? { low: range.low, high: middle } : { low: middle + 1, high: range.high };
}

/** The most questions a group of this size can take. */
export function getMaxComparisons(group: Ranked[]): number {
  return Math.ceil(Math.log2(group.length + 1));
}

/** The overall rank: items in higher sentiment groups + position + 1. */
export function getFinalRank(items: Ranked[], s: Sentiment, position: number): number {
  const groupIndex = SENTIMENT_ORDER.indexOf(s);
  const above = items.filter((item) => SENTIMENT_ORDER.indexOf(item.sentiment) < groupIndex).length;
  return above + position + 1;
}

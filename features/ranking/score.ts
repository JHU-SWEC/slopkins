import { getSentimentGroup } from "./insertion";
import type { RankedDish, Sentiment } from "./types";

/**
 * Each sentiment gets its own band, so a disliked dish can never outscore
 * a liked one. These numbers are a starting point; tune them freely.
 */
export const SCORE_RANGES: Record<Sentiment, { min: number; max: number }> = {
  liked: { min: 7, max: 10 },
  fine: { min: 4, max: 7 },
  disliked: { min: 0, max: 4 },
};

/**
 * Spreads a group evenly across its band. The top dish gets the band's max;
 * the bottom dish stays above the band's min, so bands never overlap.
 */
export function getScore(sentiment: Sentiment, position: number, groupSize: number): number {
  const { min, max } = SCORE_RANGES[sentiment];
  const score = max - ((max - min) * position) / groupSize;
  return Math.round(score * 10) / 10;
}

/** The score for one dish on a user's list. */
export function getDishScore(dishes: RankedDish[], item: RankedDish): number {
  const group = getSentimentGroup(dishes, item.sentiment);
  const position = group.findIndex((d) => d.dish_id === item.dish_id);
  return getScore(item.sentiment, position, group.length);
}

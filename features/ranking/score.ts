import type { Sentiment } from "./types";

/**
 * Each sentiment gets its own band, so a disliked dish can never outscore
 * a liked one. The lower bound is exclusive. Mirrored in the SQL function
 * public.sentiment_score; change both together.
 */
export const SCORE_RANGES: Record<Sentiment, { min: number; max: number }> = {
  liked: { min: 7, max: 10 },
  fine: { min: 4, max: 7 },
  disliked: { min: 0, max: 4 },
};

/**
 * Spreads a group evenly across its band. The top dish (position 0) gets the
 * band's max; the bottom dish stays above the band's min.
 */
export function sentimentScore(sentiment: Sentiment, position: number, groupSize: number): number {
  const { min, max } = SCORE_RANGES[sentiment];
  return max - ((max - min) * position) / groupSize;
}

export function formatScore(score: number): string {
  return (Math.round(score * 10) / 10).toFixed(1);
}

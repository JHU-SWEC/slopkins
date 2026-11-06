import type { RankedDish, Sentiment } from "./types";

/** Sentiment groups in list order: liked dishes first, disliked last. */
export const SENTIMENT_ORDER: Sentiment[] = ["liked", "fine", "disliked"];

export function getSentimentGroup(dishes: RankedDish[], s: Sentiment): RankedDish[] {
    return dishes
        .filter((item) => item.sentiment === s)
        .sort((a, b) => a.rank - b.rank);
}

/** The positions in a sentiment group where the new dish could still go. */
export type SearchRange = {
    low: number;
    high: number;
};

/** The range before any questions: low is 0 and high is the group's size. */
export function beginSearch(group: RankedDish[]): SearchRange {
    return { low: 0, high: group.length };
}

/** The position halfway through the range: floor((low + high) / 2). */
export function getMiddle(range: SearchRange): number {
    return Math.floor((range.low + range.high) / 2);
}

/** The dish to compare against next, or null once low equals high. */
export function getNextComparison(group: RankedDish[], range: SearchRange): RankedDish | null {
    if (range.low >= range.high) return null;
    return group[getMiddle(range)];
}

/** The narrowed range: high = middle if the new dish won, otherwise low = middle + 1. */
export function applyAnswer(range: SearchRange, newDishWon: boolean): SearchRange {
    const middle = getMiddle(range);
    return newDishWon
        ? { low: range.low, high: middle }
        : { low: middle + 1, high: range.high };
}

/** The most questions a group of this size can take. */
export function getMaxComparisons(group: RankedDish[]): number {
    return Math.ceil(Math.log2(group.length + 1));
}

/** The overall rank: dishes in higher sentiment groups + position + 1. */
export function getFinalRank(dishes: RankedDish[], s: Sentiment, position: number): number {
    const groupIndex = SENTIMENT_ORDER.indexOf(s);
    const dishesAbove = dishes.filter(
        (item) => SENTIMENT_ORDER.indexOf(item.sentiment) < groupIndex,
    ).length;
    return dishesAbove + position + 1;
}

/** A new list with the dish added, moving every dish at or below its rank down by 1. */
export function insertDish(dishes: RankedDish[], newDish: RankedDish): RankedDish[] {
    const shifted = dishes.map((item) =>
        item.rank >= newDish.rank ? { ...item, rank: item.rank + 1 } : item,
    );
    return [...shifted, newDish].sort((a, b) => a.rank - b.rank);
}

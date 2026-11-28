import { formatScore } from "../score";
import type { Sentiment } from "../types";
import { SENTIMENT_STYLES } from "./styles";

const SIZES = {
  // A row in the profile's Rankings list (the feed post's size).
  sm: "size-11 text-sm",
  // A smaller plate card.
  md: "size-12 text-base",
  // The result screen right after ranking.
  lg: "size-16 text-xl",
};

const LOOKS = {
  // Same as the score on feed posts: light gray ring, number in its verdict color.
  ring: "border-[1.5px] border-gray-200 font-semibold",
  // Ringed in the verdict color with a shadow, to sit on top of a photo.
  bold: "border-current font-bold shadow-lg",
};

const BOLD_BORDER = { sm: "border-2", md: "border-2", lg: "border-[3px]" };

/**
 * A plate's score as a white circle with the number in its verdict color.
 * `pop` animates it in (the result screen).
 */
export function ScoreCircle({
  score,
  sentiment,
  size = "md",
  look = "bold",
  pop = false,
}: {
  score: number;
  sentiment: Sentiment;
  size?: keyof typeof SIZES;
  look?: keyof typeof LOOKS;
  pop?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={`Plate score ${formatScore(score)} out of 10`}
      className={`grid shrink-0 place-items-center rounded-full bg-white tracking-tight tabular-nums ${SIZES[size]} ${
        LOOKS[look]
      } ${look === "bold" ? BOLD_BORDER[size] : ""} ${SENTIMENT_STYLES[sentiment].number} ${
        pop ? "transition delay-300 duration-500 ease-out starting:scale-0 starting:opacity-0 motion-reduce:transition-none" : ""
      }`}
    >
      {formatScore(score)}
    </span>
  );
}

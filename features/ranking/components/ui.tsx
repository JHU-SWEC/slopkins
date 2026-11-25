import { getHall } from "@/lib/halls";
import { formatScore } from "../score";
import type { Dish } from "../types";

/** "FFC · Global", or whichever part is known. */
export function DishMeta({ dish }: { dish: Dish }) {
  const parts = [dish.hall_slug && getHall(dish.hall_slug)?.name, dish.station].filter(Boolean);
  if (parts.length === 0) return null;
  return <span className="text-sm text-gray-500">{parts.join(" · ")}</span>;
}

export function Score({ score }: { score: number }) {
  return <span className="text-sm font-semibold tabular-nums">{formatScore(score)}</span>;
}

export function TextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-gray-500 transition hover:text-gray-700"
    >
      {children}
    </button>
  );
}

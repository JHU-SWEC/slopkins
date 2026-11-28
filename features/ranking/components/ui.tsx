import { formatScore } from "../score";

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

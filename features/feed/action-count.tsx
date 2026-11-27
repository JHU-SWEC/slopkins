/**
 * One spot in a post's icon row: the like, comment, or bookmark icon with its
 * number beside it. Every spot is the same width, so the icons sit evenly
 * spaced whether or not they have numbers, and nothing moves when the first
 * like or comment comes in.
 *
 * `children` is the 44×44 icon button. It's pulled toward the row's edge so
 * the icon lines up with the text above; the rest of its tap area overlaps
 * the empty space. `end` puts the spot at the right end of the row, with the
 * number before the icon. Screen readers get the count from the button's
 * label, not this number.
 */
export function ActionSlot({
  count,
  end = false,
  children,
}: {
  count: number;
  end?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex w-11 shrink-0 items-center ${
        end ? "ml-auto flex-row-reverse [&>:first-child]:-mr-3" : "[&>:first-child]:-ml-3"
      }`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none text-sm font-medium text-gray-500 tabular-nums ${end ? "-mr-2.5" : "-ml-2.5"}`}
      >
        {count > 0 ? count : ""}
      </span>
    </div>
  );
}

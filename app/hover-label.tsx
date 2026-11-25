// A small label that fades in under a round icon button on hover or keyboard
// focus, lined up with the button's right edge so it stays on screen.
// The button needs the `group` class (and a position, e.g. fixed).
// aria-hidden: the button's aria-label already names it for screen readers.
export function HoverLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 top-full mt-2 origin-top-right -translate-y-1 scale-95 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-gray-50 opacity-0 shadow-md transition duration-150 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
    >
      {children}
    </span>
  );
}

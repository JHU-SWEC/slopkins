import { MacroToggle } from "./macro-toggle";

// The macro toggle only appears on the dining pages.
export default function DiningLayout({ children }: LayoutProps<"/dining">) {
  return (
    <>
      {children}
      <MacroToggle />
    </>
  );
}

import { Suspense } from "react";
import { BottomNav, NavLinks } from "./bottom-nav";

// Shared shell for the signed-in screens. No auth check yet: everything is a
// mockup reachable through the Skip link.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white pb-16 text-gray-900">
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      {/* usePathname suspends on routes with unknown params. */}
      <Suspense fallback={<NavLinks />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { Tour } from "@/features/tour/Tour";
import { TourButton } from "@/features/tour/TourButton";
import { BottomNav, NavLinks } from "./bottom-nav";
import { NotificationsButton, NotificationsLink } from "./notifications-button";
import { GearIcon, SettingsMenu } from "./settings-menu";

// Shared shell for the signed-in screens. No auth check yet: everything is a
// mockup reachable through the Skip link.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-app className="min-h-screen bg-white pb-16 text-gray-900 md:pb-0 md:pl-[72px]">
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      {/* usePathname suspends on routes with unknown params. */}
      <Suspense fallback={<NavLinks />}>
        <BottomNav />
      </Suspense>
      {/* Top right, left of the tutorial and theme buttons. */}
      <Suspense fallback={<NotificationsLink />}>
        <NotificationsButton />
      </Suspense>
      <TourButton />
      {/* Phones: settings in the top-right corner. Laptops: in the sidebar. */}
      <SettingsMenu
        className="fixed right-3 top-3 z-50 md:hidden"
        buttonClassName="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-100"
        menuClassName="absolute right-0 top-full mt-2"
      >
        <GearIcon />
      </SettingsMenu>
      {/* First-visit guided tour; reads the pathname, so it suspends on its own. */}
      <Suspense>
        <Tour />
      </Suspense>
    </div>
  );
}

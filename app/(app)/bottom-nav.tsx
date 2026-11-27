"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NotificationsPanel } from "@/features/auth-social/activity/notifications-panel";
import { startTour } from "@/features/tour/Tour";
import { GearIcon, SettingsMenu } from "./settings-menu";

// Outline icons, 24×24, stroked in the tab's text color.
const tabs: { href: string; label: string; laptopOnly?: boolean; icon: React.ReactNode }[] = [
  {
    href: "/feed",
    label: "Feed",
    // House: the home screen.
    icon: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
      </>
    ),
  },
  {
    href: "/dining",
    label: "Dining",
    // Fork and knife.
    icon: (
      <>
        <path d="M4 3v5a3 3 0 0 0 6 0V3" />
        <path d="M7 3v18" />
        <path d="M17 21V3a4 4 0 0 0-3 4v6a1 1 0 0 0 1 1h2" />
      </>
    ),
  },
  {
    href: "/search",
    label: "Search",
    // Magnifying glass.
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
  },
  {
    href: "/activity",
    label: "Notifications",
    // Phones have the bell in the top right instead.
    laptopOnly: true,
    // Bell.
    icon: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    // Person.
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} />;
}

// Shared look for every sidebar row (tabs and the two buttons at the bottom).
const ROW = "flex h-full items-center justify-center transition md:h-12 md:w-full md:justify-start md:gap-4 md:rounded-xl md:px-3 md:hover:bg-gray-100";
const LABEL = "hidden whitespace-nowrap opacity-0 transition-opacity duration-200 md:inline md:group-hover/nav:opacity-100 md:group-focus-within/nav:opacity-100";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-6 w-6 shrink-0"
    >
      {children}
    </svg>
  );
}

// Rendered without an active tab while the pathname is unknown.
// Phones: a bar of icons along the bottom (the bell, tutorial, and settings
// buttons float in the top right). Laptops (md and up): everything is in a
// slim column down the left edge with no bar behind it, that widens on hover
// to show each name, like Instagram. It slides over the page rather than
// pushing it.
export function NavLinks({ pathname }: { pathname?: string }) {
  // Laptops: the bell opens a slide-out panel instead of the /activity page.
  // Remembering the page it opened on closes it when you go somewhere else.
  const [panelOpenOn, setPanelOpenOn] = useState<string | null>(null);
  const here = pathname ?? "";
  const panelOpen = panelOpenOn === here;

  return (
    <>
    <nav
      data-tour="tabs"
      // The notifications panel replaces the sidebar while it's open (laptops only;
      // phones never open it). Closing the panel brings the sidebar back.
      className={`group/nav fixed inset-x-0 bottom-0 z-40 h-16 border-t border-gray-200 bg-white md:inset-x-auto md:inset-y-0 md:left-0 md:h-auto md:w-[72px] md:overflow-hidden md:border-t-0 md:bg-transparent! md:transition-[width] md:duration-200 md:hover:w-56 md:focus-within:w-56 ${
        panelOpen ? "md:hidden" : ""
      }`}
    >
      <ul className="mx-auto flex h-full max-w-2xl md:mx-0 md:max-w-none md:flex-col md:justify-center md:gap-1 md:px-3">
        {tabs.map((tab) => {
          const isBell = tab.href === "/activity";
          const active = isBell ? panelOpen || (!panelOpenOn && pathname?.startsWith(tab.href)) : !panelOpen && pathname?.startsWith(tab.href);
          if (isBell) {
            return (
              <li key={tab.href} className="hidden md:block">
                <button
                  type="button"
                  onClick={() => setPanelOpenOn(panelOpen ? null : here)}
                  data-tour={`tab-${tab.label.toLowerCase()}`}
                  aria-label={tab.label}
                  aria-expanded={panelOpen}
                  className={`${ROW} cursor-pointer ${
                    active ? "text-heritage-blue dark:text-white" : "text-gray-400 hover:text-gray-600 md:text-gray-600 md:hover:text-gray-900"
                  }`}
                >
                  <Icon>{tab.icon}</Icon>
                  <span aria-hidden="true" className={`${LABEL} ${active ? "font-semibold" : ""}`}>
                    {tab.label}
                  </span>
                </button>
              </li>
            );
          }
          return (
            <li key={tab.href} className={tab.laptopOnly ? "hidden md:block" : "flex-1 md:flex-none"}>
              <Link
                href={tab.href}
                data-tour={`tab-${tab.label.toLowerCase()}`}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`${ROW} ${
                  active ? "text-heritage-blue dark:text-white" : "text-gray-400 hover:text-gray-600 md:text-gray-600 md:hover:text-gray-900"
                }`}
              >
                <Icon>{tab.icon}</Icon>
                {/* Laptop only: fades in as the sidebar widens. */}
                <span aria-hidden="true" className={`${LABEL} ${active ? "font-semibold" : ""}`}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Laptop only: tutorial and settings, at the bottom like Instagram's "More". */}
      <div className="absolute inset-x-3 bottom-6 hidden flex-col gap-1 md:flex">
        <button type="button" onClick={startTour} aria-label="How Slopkins works" className={`${ROW} cursor-pointer text-gray-600 hover:text-gray-900`}>
          <Icon>
            {/* Question mark in a circle. */}
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
            <path d="M12 17h.01" />
          </Icon>
          <span aria-hidden="true" className={LABEL}>
            Tutorial
          </span>
        </button>
        {/* Opens above itself; fixed so the narrow sidebar doesn't clip it. */}
        <SettingsMenu
          buttonClassName={`${ROW} cursor-pointer text-gray-600 hover:text-gray-900`}
          menuClassName="fixed bottom-[132px] left-3"
        >
          <GearIcon className="h-6 w-6" />
          <span aria-hidden="true" className={LABEL}>
            Settings
          </span>
        </SettingsMenu>
      </div>
    </nav>
    {panelOpen && <NotificationsPanel onClose={() => setPanelOpenOn(null)} />}
    </>
  );
}

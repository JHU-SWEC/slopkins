"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Outline icons, 24×24, stroked in the tab's text color.
const tabs = [
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
    label: "Activity",
    // Bell: new followers and friends' ratings.
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

// Rendered without an active tab while the pathname is unknown.
// Phones: a bar of icons along the bottom. Laptops (md and up): a slim column
// of icons, centered down the left edge with no bar behind them, that widens
// on hover to show each tab's name, like Instagram. It slides over the page
// rather than pushing it.
export function NavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav
      data-tour="tabs"
      className="group/nav fixed inset-x-0 bottom-0 z-40 h-16 border-t border-gray-200 bg-white md:inset-x-auto md:inset-y-0 md:left-0 md:h-auto md:w-[72px] md:overflow-hidden md:border-t-0 md:bg-transparent! md:transition-[width] md:duration-200 md:hover:w-56 md:focus-within:w-56"
    >
      <ul className="mx-auto flex h-full max-w-2xl md:mx-0 md:max-w-none md:flex-col md:justify-center md:gap-1 md:px-3">
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1 md:flex-none">
              <Link
                href={tab.href}
                data-tour={`tab-${tab.label.toLowerCase()}`}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`flex h-full items-center justify-center transition md:h-12 md:justify-start md:gap-4 md:rounded-xl md:px-3 md:hover:bg-gray-100 ${
                  active ? "text-heritage-blue dark:text-white" : "text-gray-400 hover:text-gray-600 md:text-gray-600 md:hover:text-gray-900"
                }`}
              >
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
                  {tab.icon}
                </svg>
                {/* Laptop only: fades in as the sidebar widens. */}
                <span
                  aria-hidden="true"
                  className={`hidden whitespace-nowrap opacity-0 transition-opacity duration-200 md:inline md:group-hover/nav:opacity-100 md:group-focus-within/nav:opacity-100 ${
                    active ? "font-semibold" : ""
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

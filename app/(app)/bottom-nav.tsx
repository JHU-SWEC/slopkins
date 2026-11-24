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
export function NavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav data-tour="tabs" className="fixed inset-x-0 bottom-0 h-16 border-t border-gray-200 bg-white">
      <ul className="mx-auto flex h-full max-w-2xl">
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                data-tour={`tab-${tab.label.toLowerCase()}`}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                title={tab.label}
                className={`flex h-full items-center justify-center transition ${
                  active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
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
                  className="h-6 w-6"
                >
                  {tab.icon}
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Main page (feed) only. */}
      {pathname === "/feed" && (
        <div className="absolute right-5 top-1/2 hidden lg:flex -translate-y-1/2 items-center gap-1 text-sm font-semibold text-gray-400">
          <span>built by</span>
          <a
            href="https://www.hopbuilds.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900"
          >
            HopBuilds
            {/* External-link icon: square with a diagonal arrow. */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
          </a>
        </div>
      )}
    </nav>
  );
}

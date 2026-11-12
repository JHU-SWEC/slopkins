"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/feed", label: "Feed" },
  { href: "/dining", label: "Dining" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} />;
}

// Rendered without an active tab while the pathname is unknown.
export function NavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 h-16 border-t border-gray-200 bg-white">
      <ul className="mx-auto flex h-full max-w-2xl">
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex h-full items-center justify-center text-sm font-semibold transition ${
                  active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Main page (feed) only. */}
      {pathname === "/feed" && (
        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm font-semibold text-gray-400">
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

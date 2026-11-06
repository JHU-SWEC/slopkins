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
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HoverLabel } from "@/app/hover-label";

// The bell: opens Activity (new followers, likes, comments). On phones it sits
// in the top right with the tutorial and theme buttons, and matches their
// look. On laptops it's a sidebar tab instead, so this hides.
export function NotificationsButton() {
  const pathname = usePathname();
  return <NotificationsLink active={pathname.startsWith("/activity")} />;
}

// Rendered without the active state while the pathname is unknown.
export function NotificationsLink({ active = false }: { active?: boolean }) {
  return (
    <Link
      href="/activity"
      data-tour="tab-activity"
      aria-label="Notifications"
      aria-current={active ? "page" : undefined}
      className={`group fixed right-[100px] top-3 z-50 grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100 md:hidden ${
        active ? "text-heritage-blue dark:text-white" : "text-gray-600"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <HoverLabel>Notifications</HoverLabel>
    </Link>
  );
}

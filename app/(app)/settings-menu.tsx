"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logOut } from "@/features/auth-social/actions";
import { createClient } from "@/lib/supabase/client";
import { toggleTheme } from "@/app/theme-toggle";

// Gear outline.
export function GearIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Signed in? The layout is shared by signed-out pages too, so ask the browser
// client (it reads the session cookie) and keep up with logins and logouts.
function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(data.session !== null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(session !== null));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

const ITEM =
  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-gray-100";

/**
 * Settings: a gear that opens a small menu with dark mode and log out.
 * `children` is what's inside the gear button; `menuClassName` places the menu.
 */
export function SettingsMenu({
  className,
  buttonClassName,
  menuClassName,
  children,
}: {
  className?: string;
  buttonClassName: string;
  menuClassName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const signedIn = useSignedIn();
  const root = useRef<HTMLDivElement>(null);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={className}>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClassName}
      >
        {children}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Settings"
          className={`z-50 w-52 rounded-2xl border border-gray-200 bg-white p-1.5 text-gray-900 shadow-xl dark:bg-gray-100 ${menuClassName}`}
        >
          {/* Stays open, so you can see the change and flip back. */}
          <button type="button" role="menuitem" onClick={toggleTheme} className={`${ITEM} text-gray-700`}>
            <span className="dark:hidden">Dark mode</span>
            <span className="hidden dark:inline">Light mode</span>
          </button>
          {signedIn === false ? (
            <Link href="/login" role="menuitem" onClick={() => setOpen(false)} className={`${ITEM} text-gray-700`}>
              Log in
            </Link>
          ) : (
            <form action={logOut}>
              <button type="submit" role="menuitem" className={`${ITEM} text-red-600 hover:text-red-700`}>
                Log out
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

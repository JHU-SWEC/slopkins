"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// Search-as-you-type box. Updates the URL (?q=...) a moment after you stop
// typing; the page reads the URL and shows the matching people.
export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);
  const [searching, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function go(query: string) {
    const url = query.trim() ? `${pathname}?q=${encodeURIComponent(query.trim())}` : pathname;
    startTransition(() => router.replace(url, { scroll: false }));
  }

  function handleChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), 250);
  }

  return (
    // A real form, so pressing Enter searches right away.
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        go(value);
      }}
      className="relative"
    >
      <label htmlFor="people-search" className="sr-only">
        Search people
      </label>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="people-search"
        type="search"
        autoComplete="off"
        autoFocus
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by name or @username"
        className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pr-10 pl-10 text-heritage-blue placeholder:text-slate-400 focus:border-heritage-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-spirit-blue/40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-spirit-blue dark:focus:bg-white/10"
      />
      {searching && (
        <span
          aria-label="Searching"
          className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-heritage-blue dark:border-white/20 dark:border-t-spirit-blue"
        />
      )}
    </form>
  );
}

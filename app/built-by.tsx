// "built by HopBuilds" in the bottom-right corner of every page. Wide screens
// only: on phones it would sit on top of the tab bar.
export function BuiltBy() {
  return (
    <div className="fixed bottom-4 right-5 z-40 hidden items-center gap-1 text-sm font-semibold text-gray-400 lg:flex">
      <span>built by</span>
      <a
        href="https://www.hopbuilds.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-heritage-blue hover:opacity-80 dark:text-white"
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
  );
}

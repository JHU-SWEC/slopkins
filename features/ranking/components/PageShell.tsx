import Link from "next/link";
import { Suspense } from "react";
import { BRAND_BG } from "./styles";

type Page = "rank" | "my-list";

const NAV: { page: Page; href: string; label: string }[] = [
  { page: "rank", href: "/rank", label: "Rank" },
  { page: "my-list", href: "/my-list", label: "My list" },
];

/** Layout shared by the ranking pages. Children load only in the browser. */
export default function PageShell({
  page,
  title,
  subtitle,
  children,
}: {
  page: Page;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#EAF3FC] via-white to-white font-sans text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        {/* pr-14 clears the fixed theme toggle until the page is wide enough. */}
        <div className="mx-auto flex max-w-2xl items-center justify-between py-3 pl-4 pr-14 md:pr-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg text-sm text-white ${BRAND_BG}`}
            >
              S
            </span>
            Slopkins
          </Link>
          <nav className="flex gap-1 whitespace-nowrap rounded-full bg-slate-100 p-1 text-sm font-medium">
            {NAV.map((item) => (
              <Link
                key={item.page}
                href={item.href}
                className={
                  item.page === page
                    ? "rounded-full bg-white px-3.5 py-1.5 text-slate-900 shadow-sm"
                    : "rounded-full px-3.5 py-1.5 text-slate-500 transition hover:text-slate-900"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-slate-500">{subtitle}</p>
        <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-3" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

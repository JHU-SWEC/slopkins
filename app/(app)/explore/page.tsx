import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import { PeopleList } from "@/features/auth-social/social/people-list";
import { getNewestProfiles, searchProfiles } from "@/features/auth-social/social/queries";
import { SearchBox } from "@/features/auth-social/social/search-box";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Explore · Slopkins" };

// /explore?q=... — find people by name or username. (/search redirects here.)
export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const query = searchParams.then(({ q }) => (typeof q === "string" ? q : ""));
  return (
    <div className="text-heritage-blue dark:text-white">
      <h1 className="text-2xl font-bold tracking-tight">Explore</h1>

      {/* Section 1: Find friends (search, then new members). Section 2, Featured
          lists, comes after it inside Results, before you type. */}
      <h2 className="mb-3 mt-6 text-lg font-bold tracking-tight">Find friends</h2>
      <Suspense fallback={<SearchBox initialQuery="" />}>
        {query.then((q) => (
          <SearchBox initialQuery={q} />
        ))}
      </Suspense>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />}>
        {query.then((q) => (
          <Results query={q} />
        ))}
      </Suspense>
    </div>
  );
}

const NEW_MEMBERS_SHOWN = 5;

async function Results({ query }: { query: string }) {
  // Wait for the real request: the sign-in check reads the clock, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  const viewerId = user?.id ?? null;

  // Before you type: a few of the newest members, so there's someone to follow
  // (kept short so Featured lists stays in view), then Featured lists.
  if (!query.trim()) {
    const newest = await getNewestProfiles(supabase, viewerId, NEW_MEMBERS_SHOWN);
    return (
      <>
        <section className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">New on Slopkins</h3>
          <div className="mt-1">
            <PeopleList people={newest} viewerId={viewerId} empty="No one else has joined yet." />
          </div>
        </section>
        {/* Placeholder: the lists themselves are still to be decided. */}
        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight">Featured lists</h2>
          <p className="mt-3 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            Coming soon.
          </p>
        </section>
      </>
    );
  }

  const people = await searchProfiles(supabase, query, viewerId);
  return (
    <section className="mt-6" aria-live="polite">
      <h2 className="sr-only">Results</h2>
      <PeopleList people={people} viewerId={viewerId} empty={`No one matches "${query.trim()}".`} />
    </section>
  );
}

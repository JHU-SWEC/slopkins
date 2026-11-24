import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PeopleList } from "@/features/auth-social/social/people-list";
import { getNewestProfiles, searchProfiles } from "@/features/auth-social/social/queries";
import { SearchBox } from "@/features/auth-social/social/search-box";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Search · Slopkins" };

// /search?q=... — find people by name or username.
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  const query = searchParams.then(({ q }) => (typeof q === "string" ? q : ""));
  return (
    <div className="text-heritage-blue">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Search</h1>
      <Suspense fallback={<SearchBox initialQuery="" />}>
        {query.then((q) => (
          <SearchBox initialQuery={q} />
        ))}
      </Suspense>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-100" />}>
        {query.then((q) => (
          <Results query={q} />
        ))}
      </Suspense>
    </div>
  );
}

async function Results({ query }: { query: string }) {
  // Wait for the real request: the sign-in check reads the clock, which Next.js
  // doesn't allow while it's preparing pages ahead of time.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  // Before you type: show the newest members, so there's someone to follow.
  if (!query.trim()) {
    const newest = await getNewestProfiles(supabase, viewerId);
    return (
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">New on Slopkins</h2>
        <div className="mt-1">
          <PeopleList people={newest} viewerId={viewerId} empty="No one else has joined yet." />
        </div>
      </section>
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

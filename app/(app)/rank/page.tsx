import { Suspense } from "react";
import RankMeal from "@/features/ranking/components/RankMeal";

// Step two of logging: rank the meal's rankable dishes. /rank?meal=<id>
export default function RankPage({ searchParams }: PageProps<"/rank">) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Rank your meal</h1>
      <p className="mt-1 text-gray-500">A few quick questions per dish. Skip any you like.</p>
      {/* Reads localStorage and the URL, so it renders in the browser only. */}
      <Suspense fallback={<div className="mt-6 h-72 animate-pulse rounded-3xl bg-gray-100" />}>
        <RankMeal searchParams={searchParams} />
      </Suspense>
    </>
  );
}

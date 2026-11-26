import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import RankMeal from "@/features/ranking/components/RankMeal";
import { primaryButton } from "@/features/ranking/components/styles";
import { getMeal, getRankedPlates } from "@/features/ranking/queries";
import { createClient, getSignedInUser } from "@/lib/supabase/server";

// Step two of logging: rank the plate as a whole. /rank?meal=<id>
export default function RankPage({ searchParams }: PageProps<"/rank">) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Rank your plate</h1>
      <p className="mt-1 text-gray-500">How was it, and how does it compare to your past plates?</p>
      <Suspense fallback={<div className="mt-6 h-72 animate-pulse rounded-3xl bg-gray-100" />}>
        <RankQueue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function RankQueue({ searchParams }: { searchParams: PageProps<"/rank">["searchParams"] }) {
  const { meal: mealParam } = await searchParams;
  // The sign-in check reads the clock, which needs a real request.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) redirect("/login");

  const [meal, list] = await Promise.all([
    getMeal(supabase, Number(mealParam)),
    getRankedPlates(supabase, user.id),
  ]);

  // Meals are public, but only your own can be ranked.
  if (!meal || meal.user_id !== user.id) {
    return (
      <div className="mt-6">
        <p className="text-gray-500">That meal couldn&apos;t be found.</p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Log a meal
        </Link>
      </div>
    );
  }

  return <RankMeal meal={meal} list={list} />;
}

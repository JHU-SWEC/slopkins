import Link from "next/link";
import { connection } from "next/server";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import { mealTitle } from "../format";
import { getMealsWithPendingDishes } from "../queries";
import { listBox } from "./styles";

/** Reminds the user about logged plates they haven't ranked or skipped yet. Render in Suspense. */
export default async function PendingMeals() {
  // The sign-in check reads the clock, which needs a real request.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await getSignedInUser(supabase);
  if (!user) return null;

  const meals = await getMealsWithPendingDishes(supabase, user.id);
  if (meals.length === 0) return null;

  return (
    <ul className={`mt-6 ${listBox}`}>
      {meals.map((meal) => (
          <li key={meal.id}>
            <Link
              href={`/rank?meal=${meal.id}`}
              className="flex items-center justify-between px-4 py-3 transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">Plate to rank</p>
                <p className="text-sm text-gray-500">{mealTitle(meal)}</p>
              </div>
              <span className="text-sm font-semibold text-brand">Rank ›</span>
            </Link>
          </li>
      ))}
    </ul>
  );
}

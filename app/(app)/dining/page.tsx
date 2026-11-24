import Link from "next/link";
import { Suspense } from "react";
import PendingMeals from "@/features/ranking/components/PendingMeals";
import { halls } from "@/lib/halls";

export default function Dining() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Dining halls</h1>
      <p className="mt-1 text-gray-500">Where did you just eat?</p>

      {/* Logged meals with dishes still waiting to be ranked. */}
      <Suspense>
        <PendingMeals />
      </Suspense>

      <ul data-tour="hall-list" className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-200">
        {halls.map((hall) => (
          <li key={hall.slug}>
            <Link
              href={`/dining/${hall.slug}`}
              className="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">{hall.name}</p>
                <p className="text-sm text-gray-500">{hall.description}</p>
              </div>
              <span className="text-gray-300">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

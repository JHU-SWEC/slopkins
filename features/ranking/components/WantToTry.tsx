import Link from "next/link";
import { shownName } from "@/features/auth-social/profile/shared";
import type { SavedPlate, WantToTryItem } from "../types";
import { RemoveSavedPlate, RemoveWantToTry } from "./want-to-try-buttons";
import { listBox, primaryButton, sectionHeading } from "./styles";
import { DishMeta } from "./ui";

/**
 * Your saved dishes and plates, newest first. Only shown on your own profile.
 * Plates are whole meals saved from other people's feed posts.
 */
export default function WantToTry({ items, plates = [] }: { items: WantToTryItem[]; plates?: SavedPlate[] }) {
  if (items.length === 0 && plates.length === 0) {
    return (
      <div className="mt-6 text-center">
        <p className="text-gray-500">
          Tap the bookmark on any dish or friend&apos;s post to save it here.
        </p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Browse menus
        </Link>
      </div>
    );
  }

  const dishList = (
    <ul className={listBox}>
      {items.map(({ dish }) => (
        <li key={dish.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{dish.name}</p>
            <DishMeta dish={dish} />
          </div>
          <RemoveWantToTry dishId={dish.id} name={dish.name} />
        </li>
      ))}
    </ul>
  );

  // Only dishes saved: keep the original plain list.
  if (plates.length === 0) return dishList;

  return (
    <div className="space-y-6">
      <section>
        <h3 className={sectionHeading}>Plates · {plates.length}</h3>
        <ul className={`mt-2 ${listBox}`}>
          {plates.map((plate) => (
            <li key={plate.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {plate.from ? `${shownName(plate.from)}'s ${plate.meal ?? "meal"}` : `A ${plate.meal ?? "meal"}`}
                  {plate.hall && <span className="font-normal text-gray-500"> · {plate.hall.name}</span>}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {plate.dishes.map((dish) => (
                    <li key={dish.id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-700">
                      {dish.name}
                    </li>
                  ))}
                </ul>
              </div>
              <RemoveSavedPlate plateId={plate.id} />
            </li>
          ))}
        </ul>
      </section>

      {items.length > 0 && (
        <section>
          <h3 className={sectionHeading}>Dishes · {items.length}</h3>
          <div className="mt-2">{dishList}</div>
        </section>
      )}
    </div>
  );
}

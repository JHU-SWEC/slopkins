import Link from "next/link";
import type { WantToTryItem } from "../types";
import { RemoveWantToTry } from "./want-to-try-buttons";
import { listBox, primaryButton } from "./styles";
import { DishMeta } from "./ui";

/** Your saved dishes, newest first. Only shown on your own profile. */
export default function WantToTry({ items }: { items: WantToTryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-6 text-center">
        <p className="text-gray-500">
          Tap the bookmark next to any dish on a menu to save it here. Ranking it takes it off the list.
        </p>
        <Link href="/dining" className={`mt-4 ${primaryButton}`}>
          Browse menus
        </Link>
      </div>
    );
  }

  return (
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
}

import { shownName } from "@/features/auth-social/profile/shared";
import { getHall } from "@/lib/halls";
import type { SavedPlate, WantToTryItem } from "../types";
import { EmptyTab, LIST_BOX, LIST_ROW, ListCount, PlateThumb, RowText } from "./list-row";
import { RemoveSavedPlate, RemoveWantToTry } from "./want-to-try-buttons";

/**
 * Someone's saved plates and dishes, newest first, in the same rows as the
 * Rankings tab: plates (whole meals saved from friends' posts) with their
 * photo, then dishes (bookmarked on a menu). Public on every profile;
 * `isOwner` adds the remove buttons and changes the empty state.
 */
export default function WantToTry({
  items,
  plates = [],
  isOwner,
}: {
  items: WantToTryItem[];
  plates?: SavedPlate[];
  isOwner: boolean;
}) {
  if (items.length === 0 && plates.length === 0) {
    return isOwner ? (
      <EmptyTab
        message="Tap the bookmark on a dish or a friend's post to save it here."
        action={{ label: "Browse menus", href: "/dining" }}
      />
    ) : (
      <EmptyTab message="Nothing saved yet." />
    );
  }

  return (
    <div className="space-y-6">
      {plates.length > 0 && (
        <section>
          <div className="mb-3">
            <ListCount count={plates.length} one="plate" many="plates" />
          </div>
          <ul className={LIST_BOX}>
            {plates.map((plate) => (
              <li key={plate.id} className={LIST_ROW}>
                <PlateThumb photoPath={plate.photo_path} />
                <RowText
                  title={plateTitle(plate)}
                  detail={[
                    plate.from && `from ${shownName(plate.from)}`,
                    plate.dishes.map((dish) => dish.name).join(", "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
                {isOwner && <RemoveSavedPlate plateId={plate.id} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length > 0 && (
        <section>
          <div className="mb-3">
            <ListCount count={items.length} one="dish" many="dishes" />
          </div>
          <ul className={LIST_BOX}>
            {items.map(({ dish }) => (
              <li key={dish.id} className={LIST_ROW}>
                <RowText
                  title={dish.name}
                  detail={[dish.hall_slug && getHall(dish.hall_slug)?.name, dish.station].filter(Boolean).join(" · ")}
                />
                {isOwner && <RemoveWantToTry dishId={dish.id} name={dish.name} />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** "FFC · Lunch", like a ranked plate's title. */
function plateTitle(plate: SavedPlate): string {
  const hall = plate.hall?.name ?? "A dining hall";
  return plate.meal ? `${hall} · ${plate.meal[0].toUpperCase()}${plate.meal.slice(1)}` : hall;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getHall, halls } from "@/lib/halls";
import { currentMeal, formatDay, menuDays, pickMenuDate, todayISO } from "@/lib/dates";
import { getMenus, listMenus } from "@/lib/menus";
import { createClient, getSignedInUser } from "@/lib/supabase/server";
import { getDishScoresByFoodId, getWantToTryFoodIds } from "@/features/ranking/queries";
import { DaySwitcher, type MenuDay } from "./day-switcher";
import { MenuPicker } from "./menu-picker";

// Cache Components needs at least one param to prerender.
export function generateStaticParams() {
  return halls.map((hall) => ({ slug: hall.slug }));
}

// A day's menu for this hall (today unless ?date= picks a day in the coming
// week), from Nutrislice through the weekly cache in lib/menus.ts.
export default function HallMenuPage({ params, searchParams }: PageProps<"/dining/[slug]">) {
  return (
    <div className="text-heritage-blue dark:text-white">
      <Link href="/dining" className="text-sm text-gray-500 hover:text-gray-700">
        ‹ Dining halls
      </Link>
      {/* params is URL data, so it streams in behind Suspense for instant navigation. */}
      <Suspense fallback={<MenuFallback />}>
        <HallMenu params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HallMenu({
  params,
  searchParams,
}: {
  params: PageProps<"/dining/[slug]">["params"];
  searchParams: PageProps<"/dining/[slug]">["searchParams"];
}) {
  const { slug } = await params;
  const hall = getHall(slug);
  if (!hall) notFound();

  // Render per request so "today" is always current. The menu itself comes
  // from the weekly cache, so this stays fast.
  await connection();
  const today = todayISO();
  const date = pickMenuDate((await searchParams).date, today);
  const isToday = date === today;

  // Signed-in people get bookmarks for Want to try, already filled for saved dishes.
  const supabase = await createClient();
  const savedFoodIds = getSignedInUser(supabase)
    .then(({ data: { user } }) => (user ? getWantToTryFoodIds(supabase, user.id) : null))
    .catch(() => null);

  let tabs;
  try {
    tabs = await getMenus(hall, date);
  } catch (error) {
    console.warn("[dining]", (error as Error).message);
    return (
      <>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
        <DaySwitcher days={dayLinks(hall.slug, today)} date={date}>
          <p className="mt-6 text-gray-500">
            Couldn&apos;t load {isToday ? "today's" : `${formatDay(date)}'s`} menu. Try again in a bit.
          </p>
        </DaySwitcher>
      </>
    );
  }

  // Each item's score from everyone's ranked plates. Missing scores just don't show.
  const scores = await getDishScoresByFoodId(
    supabase,
    tabs.flatMap((t) => t.dishes.map((dish) => dish.id)),
  ).catch(() => ({}));

  // Today opens on the meal being served now (or the next one that has food);
  // other days start on the first tab. Halls without meals (Levering) start on
  // their first kitchen.
  let firstTab = 0;
  if (isToday) {
    const order = ["breakfast", "lunch", "dinner"] as const;
    const fromNow = order.slice(order.indexOf(currentMeal()));
    const found = fromNow
      .map((meal) => tabs.findIndex((t) => t.meal === meal && t.dishes.length > 0))
      .find((index) => index >= 0);
    if (found !== undefined) firstTab = found;
  }

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
      <p className="mt-1 text-gray-500">
        {isToday
          ? "Select everything you ate."
          : `Plan ahead for ${formatDay(date, { weekday: "long" })}. You can log it that day.`}
      </p>
      <DaySwitcher days={dayLinks(hall.slug, today)} date={date}>
        {/* Keyed by date so picking another day starts a fresh meal. */}
        <MenuPicker
          key={date}
          hallSlug={hall.slug}
          tabs={listMenus(tabs)}
          firstTab={firstTab}
          canLog={isToday}
          date={date}
          savedFoodIds={await savedFoodIds}
          scores={scores}
        />
      </DaySwitcher>
    </>
  );
}

// Today and the next few days. Future days can be browsed and planned, not logged.
function dayLinks(slug: string, today: string): MenuDay[] {
  return menuDays(today).map((day, i) => ({
    date: day,
    href: day === today ? `/dining/${slug}` : `/dining/${slug}?date=${day}`,
    top: i === 0 ? "Today" : formatDay(day, { month: undefined, day: undefined }),
    number: formatDay(day, { weekday: undefined, month: undefined }),
  }));
}

function MenuFallback() {
  return (
    <div className="mt-2 animate-pulse">
      <div className="h-8 w-32 rounded bg-gray-200" />
      <div className="mt-6 h-9 w-full rounded-full bg-gray-100" />
      <div className="mt-6 h-40 w-full rounded-2xl bg-gray-100" />
    </div>
  );
}

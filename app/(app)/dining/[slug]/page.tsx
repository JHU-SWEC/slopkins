import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getHall, halls } from "@/lib/halls";
import { formatDay, menuDays, pickMenuDate, todayISO } from "@/lib/dates";
import { getMenus } from "@/lib/menus";
import { MenuPicker } from "./menu-picker";

// Cache Components needs at least one param to prerender.
export function generateStaticParams() {
  return halls.map((hall) => ({ slug: hall.slug }));
}

// A day's menu for this hall (today unless ?date= picks a day in the coming
// week), fetched live from Nutrislice.
export default function HallMenuPage({ params, searchParams }: PageProps<"/dining/[slug]">) {
  return (
    <>
      <Link href="/dining" className="text-sm text-gray-500 hover:text-gray-700">
        ‹ Dining halls
      </Link>
      {/* params is URL data, so it streams in behind Suspense for instant navigation. */}
      <Suspense fallback={<MenuFallback />}>
        <HallMenu params={params} searchParams={searchParams} />
      </Suspense>
    </>
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

  // Fetch per request so the menu (and "today") is always current.
  await connection();
  const today = todayISO();
  const date = pickMenuDate((await searchParams).date, today);
  const isToday = date === today;

  let tabs;
  try {
    tabs = await getMenus(hall, date);
  } catch (error) {
    console.warn("[dining]", (error as Error).message);
    return (
      <>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
        <DayPicker slug={hall.slug} date={date} today={today} />
        <p className="mt-6 text-gray-500">
          Couldn&apos;t load {isToday ? "today's" : `${formatDay(date)}'s`} menu. Try again in a bit.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
      <p className="mt-1 text-gray-500">
        {isToday
          ? "Select everything you ate."
          : `Plan ahead for ${formatDay(date, { weekday: "long" })}. You can log it that day.`}
      </p>
      <DayPicker slug={hall.slug} date={date} today={today} />

      {/* Keyed by date so picking another day starts a fresh meal. */}
      <MenuPicker key={date} tabs={tabs} canLog={isToday} />
    </>
  );
}

// Today and the next few days. Future days can be browsed and planned, not logged.
function DayPicker({ slug, date, today }: { slug: string; date: string; today: string }) {
  return (
    <nav aria-label="Day" className="-mx-4 mt-4 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {menuDays(today).map((day, i) => {
          const active = day === date;
          return (
            <li key={day}>
              <Link
                href={day === today ? `/dining/${slug}` : `/dining/${slug}?date=${day}`}
                scroll={false}
                aria-current={active ? "date" : undefined}
                className={`flex w-14 flex-col items-center rounded-xl py-1.5 text-center transition ${
                  active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-xs font-medium">
                  {i === 0 ? "Today" : formatDay(day, { month: undefined, day: undefined })}
                </span>
                <span className="text-lg font-semibold leading-tight">
                  {formatDay(day, { weekday: undefined, month: undefined })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
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

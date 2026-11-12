import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getHall, halls } from "@/lib/halls";
import { getMenus } from "@/lib/menus";
import { MenuPicker } from "./menu-picker";

// Cache Components needs at least one param to prerender.
export function generateStaticParams() {
  return halls.map((hall) => ({ slug: hall.slug }));
}

// Today's menu for this hall, fetched live from Nutrislice.
export default function HallMenuPage({ params }: PageProps<"/dining/[slug]">) {
  return (
    <>
      <Link href="/dining" className="text-sm text-gray-500 hover:text-gray-700">
        ‹ Dining halls
      </Link>
      {/* params is URL data, so it streams in behind Suspense for instant navigation. */}
      <Suspense fallback={<MenuFallback />}>
        <HallMenu params={params} />
      </Suspense>
    </>
  );
}

async function HallMenu({ params }: { params: PageProps<"/dining/[slug]">["params"] }) {
  const { slug } = await params;
  const hall = getHall(slug);
  if (!hall) notFound();

  // Fetch per request so the menu (and "today") is always current.
  await connection();
  let tabs;
  try {
    tabs = await getMenus(hall);
  } catch (error) {
    console.warn("[dining]", (error as Error).message);
    return (
      <>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
        <p className="mt-6 text-gray-500">Couldn&apos;t load today&apos;s menu. Try again in a bit.</p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
      <p className="mt-1 text-gray-500">Select everything you ate.</p>

      <MenuPicker tabs={tabs} />
    </>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getHall, halls } from "@/lib/halls";
import { mockMenus } from "@/lib/mock-data";
import { MenuPicker } from "./menu-picker";

// Cache Components needs at least one param to prerender.
export function generateStaticParams() {
  return halls.map((hall) => ({ slug: hall.slug }));
}

// Menu skeleton with mock dishes. Real data: today's menu_items for this hall.
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

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
      <p className="mt-1 text-gray-500">Select everything you ate.</p>

      <MenuPicker tabs={mockMenus[hall.slug]} />
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

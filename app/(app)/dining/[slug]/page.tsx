import Link from "next/link";
import { notFound } from "next/navigation";
import { getHall, halls } from "@/lib/halls";
import { mockMenus } from "@/lib/mock-data";
import { MenuPicker } from "./menu-picker";

// Cache Components needs at least one param to prerender.
export function generateStaticParams() {
  return halls.map((hall) => ({ slug: hall.slug }));
}

// Menu skeleton with mock dishes. Real data: today's menu_items for this hall.
export default async function HallMenu({ params }: PageProps<"/dining/[slug]">) {
  const { slug } = await params;
  const hall = getHall(slug);
  if (!hall) notFound();

  return (
    <>
      <Link href="/dining" className="text-sm text-gray-500 hover:text-gray-700">
        ‹ Dining halls
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{hall.name}</h1>
      <p className="mt-1 text-gray-500">Select everything you ate.</p>

      <MenuPicker tabs={mockMenus[hall.slug]} />
    </>
  );
}

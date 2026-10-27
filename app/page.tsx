import Link from "next/link";

const halls = [
  { slug: "ffc", name: "FFC", description: "Fresh Food Cafe" },
  { slug: "nolans", name: "Nolan's", description: "Nolan's on 33rd" },
  { slug: "levering", name: "Levering", description: "Levering Kitchens" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">Slopkins</h1>
        <p className="mt-2 text-gray-500">Rank the slop. Find the good stuff.</p>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Dining halls
        </h2>
        <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200">
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

        <Link
          href="/rank"
          className="mt-8 block w-full rounded-md bg-blue-600 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
        >
          Rank a dish
        </Link>
      </main>
    </div>
  );
}
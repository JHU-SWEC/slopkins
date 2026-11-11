import Link from "next/link";

// Profile placeholder. Lucas owns the design.
export default function Profile() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-10 text-center text-gray-500">In progress</p>
      <Link
        href="/my-list"
        className="mt-6 block w-full rounded-md border border-gray-200 py-3 text-center font-semibold transition hover:bg-gray-50"
      >
        My list
      </Link>
    </>
  );
}

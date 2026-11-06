import Link from "next/link";

// Sign-in skeleton. Lucas and Amy own the real sign-in.
export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center bg-white text-gray-900">
      <main className="mx-auto w-full max-w-sm px-4 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Slopkins</h1>
        <p className="mt-2 text-gray-500">Rank the slop. Find the good stuff.</p>

        <button
          type="button"
          disabled
          className="mt-10 w-full rounded-md bg-blue-600 py-3 font-semibold text-white opacity-60"
        >
          Sign in with JHU
        </button>
        <p className="mt-2 text-xs text-gray-400">Sign-in isn&apos;t built yet.</p>

        {/* Mockup only. Remove when real sign-in ships. */}
        <Link
          href="/feed"
          className="mt-6 inline-block text-sm font-medium text-gray-500 underline-offset-4 hover:underline"
        >
          Skip
        </Link>
      </main>
    </div>
  );
}

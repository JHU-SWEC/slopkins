import Link from "next/link";
import { GoogleSignInButton } from "@/features/auth-social/google-sign-in-button";

// Sign-in screen. Lucas and Amy own the real sign-in.
export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center bg-white text-gray-900">
      <main className="mx-auto w-full max-w-sm px-4 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Slopkins</h1>
        <p className="mt-2 text-gray-500">Rank the slop. Find the good stuff.</p>

        <div className="mt-10">
          <GoogleSignInButton />
        </div>

        {/* Mockup only. Remove when every screen uses real data. */}
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

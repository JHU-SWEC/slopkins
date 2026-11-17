import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/features/auth-social/google-sign-in-button";

export const metadata: Metadata = { title: "Log in · Slopkins" };

// /login — where pages like /profile send you if you're not signed in.
// Google sign-in also creates the account the first time, so there's no separate sign-up page.
export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-spirit-blue px-4 py-16 text-heritage-blue">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-sm font-semibold text-heritage-blue underline-offset-2 hover:underline"
        >
          ‹ Slopkins
        </Link>

        {/* The white card, with a navy stripe across the top. */}
        <div className="mt-4 rounded-2xl border-t-8 border-heritage-blue bg-white p-8 shadow-xl shadow-heritage-blue/30">
          <h1 className="text-3xl font-bold tracking-tight">Log in</h1>
          <p className="mt-2 text-heritage-blue/80">
            Slopkins. Rank the Greatest Food in the Greatest City.
          </p>
          <div className="mt-8">
            <GoogleSignInButton />
          </div>
          <p className="mt-4 text-center text-xs text-heritage-blue/60">
            New here? Continuing with Google creates your account.
          </p>
        </div>
      </div>
    </main>
  );
}

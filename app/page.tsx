import { GoogleSignInButton } from "@/features/auth-social/google-sign-in-button";

// Sign-in screen. Lucas and Amy own the real sign-in.
export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center bg-white text-heritage-blue dark:text-white">
      <main className="mx-auto w-full max-w-sm px-4 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Slopkins</h1>
        <p className="mt-2 text-gray-500">Rank the slop. Find the good stuff.</p>

        <div className="mt-10">
          <GoogleSignInButton />
        </div>
      </main>
    </div>
  );
}

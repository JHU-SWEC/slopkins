import Link from "next/link";

// Where /auth/callback sends people if Google sign-in didn't finish.
export default function AuthErrorPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-spirit-blue px-4 py-16 text-heritage-blue">
      <div className="w-full max-w-sm rounded-2xl border-t-8 border-heritage-blue bg-white p-8 shadow-xl shadow-heritage-blue/30">
        <h1 className="text-2xl font-bold">Sign-in didn&apos;t finish</h1>
        <p className="mt-2 text-heritage-blue/80">
          You may have closed the Google window, or the link expired. Give it another try.
        </p>
        <Link
          href="/login"
          className="mt-6 block w-full rounded-md bg-heritage-blue py-3 text-center font-semibold text-white transition hover:bg-heritage-blue/90"
        >
          Back to log in
        </Link>
      </div>
    </main>
  );
}

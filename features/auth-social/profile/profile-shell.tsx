import Link from "next/link";

// Gray placeholder blocks shown for a split second while a profile loads.
export function ProfileSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading profile">
      <div className="h-72 rounded-3xl bg-slate-100" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-3xl bg-slate-100" />
    </div>
  );
}

// A friendly message card, e.g. "Profile not found".
export function ProfileMessage({
  title,
  body,
  linkHref,
  linkLabel,
}: {
  title: string;
  body: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-heritage-blue">{title}</h1>
      <p className="mt-2 text-slate-500">{body}</p>
      <Link
        href={linkHref}
        className="mt-6 inline-block rounded-xl bg-heritage-blue px-5 py-3 font-semibold text-white transition hover:bg-heritage-blue/90"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

// Gray placeholder rows shown for a split second while a list of people loads.
export function PeopleListSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg bg-gray-100" />
      <div className="mt-5 h-11 rounded-lg bg-gray-100" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="size-12 rounded-full bg-gray-100" />
          <div className="h-4 flex-1 rounded bg-gray-100" />
          <div className="h-9 w-24 rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

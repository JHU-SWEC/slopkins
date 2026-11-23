import { Suspense } from "react";
import MyList from "@/features/ranking/components/MyList";

export default function MyListPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">My list</h1>
      <p className="mt-1 text-gray-500">Every dish you&apos;ve ranked, best first.</p>
      <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-3xl bg-gray-100" />}>
        <MyList />
      </Suspense>
    </>
  );
}

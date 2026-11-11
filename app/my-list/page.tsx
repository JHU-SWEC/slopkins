import MyList from "@/features/ranking/components/MyList";
import PageShell from "@/features/ranking/components/PageShell";

export default function MyListPage() {
  return (
    <PageShell page="my-list" title="My list" subtitle="Every dish you've ranked, best first.">
      <MyList />
    </PageShell>
  );
}

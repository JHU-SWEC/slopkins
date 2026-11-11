import PageShell from "@/features/ranking/components/PageShell";
import RankFlow from "@/features/ranking/components/RankFlow";

export default function RankPage() {
  return (
    <PageShell page="rank" title="Rank a dish" subtitle="A few quick questions and it's on your list.">
      <RankFlow />
    </PageShell>
  );
}

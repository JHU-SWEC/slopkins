import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

// Temporary page. Delete once real tables exist.
async function ConnectionStatus() {
  const supabase = await createClient();
  const { error } = await supabase.from("_connection_test").select("*").limit(1);

  // PGRST205 = "table not found": Supabase answered, so URL and key are valid.
  const connected = error?.code === "PGRST205" || !error;

  return (
    <>
      <h1 className="text-2xl font-bold">
        {connected ? "✅ Connected to Supabase" : "❌ Not connected"}
      </h1>
      {!connected && (
        <pre className="mt-4 whitespace-pre-wrap text-sm text-red-600">
          {error?.message}
        </pre>
      )}
    </>
  );
}

export default function TestSupabase() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <Suspense fallback={<p>Checking connection…</p>}>
        <ConnectionStatus />
      </Suspense>
    </main>
  );
}

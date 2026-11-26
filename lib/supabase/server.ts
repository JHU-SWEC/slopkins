import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// For Server Components, Server Actions, and Route Handlers.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore because proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}

/**
 * Who's signed in, or null. Reads the login token and checks its signature
 * against Supabase's public key (cached), so there's no call to Supabase per
 * request, unlike auth.getUser(). Shaped like getUser()'s result, so callers
 * read `data.user.id` the same way.
 *
 * The token lasts up to an hour, so a sign-out on another device can take
 * that long to show up here. Pages that need the live account (email,
 * metadata), like profile/edit, still use getUser().
 */
export async function getSignedInUser(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  return { data: { user: id ? { id } : null } };
}

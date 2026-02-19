import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Get the current user from the session (server-only).
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication. Throws a Response (401) if not logged in.
 * Use in API routes: const user = await requireAuth();
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized", message: "Sign in required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

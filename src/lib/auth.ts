import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Get the current user from the session (server-only).
 * Returns null if not authenticated or if Supabase auth is not configured.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isAuthConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication when Supabase is configured. Throws 401 if not logged in.
 * When Supabase is not configured, returns null (allows unauthenticated access for local dev).
 */
export async function requireAuth(): Promise<User | null> {
  if (!isAuthConfigured()) return null;
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized", message: "Sign in required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

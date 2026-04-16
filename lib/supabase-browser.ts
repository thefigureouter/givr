/**
 * Cookie-based Supabase client for browser usage.
 * Using @supabase/ssr ensures the session is stored in cookies (not localStorage)
 * so the proxy/middleware can read it and make auth decisions server-side.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseBrowserConfigured = !!(url && anonKey);

// Singleton — ensures all components share the same in-memory session state.
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (!supabaseBrowserConfigured) return null;
  if (!_client) _client = createBrowserClient(url, anonKey);
  return _client;
}

/**
 * Returns the current authenticated user by reading the session from cookie
 * storage — no network call required, so it never fails due to network issues.
 * Use this in client components instead of client.auth.getUser().
 */
export async function getAuthUser(): Promise<User | null> {
  const client = getBrowserSupabase();
  if (!client) return null;
  const { data: { session } } = await client.auth.getSession();
  return session?.user ?? null;
}

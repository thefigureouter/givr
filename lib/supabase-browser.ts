/**
 * Cookie-based Supabase client for browser usage.
 * Using @supabase/ssr ensures the session is stored in cookies (not localStorage)
 * so the proxy/middleware can read it and make auth decisions server-side.
 */
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseBrowserConfigured = !!(url && anonKey);

/** Call once per component — @supabase/ssr deduplicates internally. */
export function getBrowserSupabase() {
  if (!supabaseBrowserConfigured) return null;
  return createBrowserClient(url, anonKey);
}

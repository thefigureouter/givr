/**
 * Server-side Supabase helper for Next.js Route Handlers.
 *
 * Uses @supabase/ssr to read the session from the request cookies —
 * the same cookie written by createBrowserClient() on the client.
 * This is the correct way to identify the caller in API routes.
 */
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

/**
 * Returns the authenticated user's ID from request cookies.
 * Falls back to 'demo-user-id' when Supabase is not configured or the
 * request is unauthenticated (demo/local dev mode).
 */
export async function getServerUserId(req: NextRequest): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return 'demo-user-id';

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      // Route handlers can't mutate the response from inside createServerClient,
      // so setAll is a no-op here. Session refreshes are handled by proxy.ts.
      setAll() {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? 'demo-user-id';
}

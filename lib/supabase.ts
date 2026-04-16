import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = !!(url && anonKey);

// Client-side client (anon key, respects RLS)
export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!)
  : null;

// Server-side admin client (service role, bypasses RLS)
export const supabaseAdmin =
  supabaseConfigured && serviceKey
    ? createClient(url!, serviceKey)
    : null;

export async function getSession() {
  if (!supabase) return { user: { id: 'demo-user-id', email: 'alex@email.com' }, access_token: 'mock_token' };
  const { data } = await supabase.auth.getSession();
  return data.session ?? { user: { id: 'demo-user-id', email: 'alex@email.com' }, access_token: 'mock_token' };
}

export async function getCurrentUserId(): Promise<string> {
  if (!supabase) return 'demo-user-id';
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? 'demo-user-id';
}

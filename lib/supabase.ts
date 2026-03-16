// TODO: [SUPABASE] Uncomment when SUPABASE credentials are set:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

export const mockSession = {
  user: { id: 'demo-user-id', email: 'alex@email.com' },
  access_token: 'mock_token',
};

export function getSession() {
  // TODO: [SUPABASE] Replace with supabase.auth.getSession()
  return mockSession;
}

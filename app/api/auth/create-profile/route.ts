/**
 * POST /api/auth/create-profile
 *
 * Belt-and-suspenders profile creation — called from the signup page after
 * supabase.auth.signUp() succeeds.  Uses the service-role key so it bypasses
 * RLS and works even if the handle_new_user trigger hasn't fired yet.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  if (!supabaseConfigured || !supabaseAdmin) {
    // Demo mode — no-op
    return NextResponse.json({ ok: true });
  }

  let body: { userId?: string; email?: string; name?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const { userId, email, name } = body;
  if (!userId || !email) {
    return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: userId,
        name: name ?? email.split('@')[0],
        email,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

  if (error) {
    console.error('[create-profile]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

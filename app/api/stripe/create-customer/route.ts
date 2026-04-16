import { NextRequest, NextResponse } from 'next/server';
import { createCustomer } from '@/lib/stripe';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { getServerUserId } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const userId = await getServerUserId(req);

  let body: { email?: string; name?: string } = {};
  try { body = await req.json(); } catch { /* use empty defaults */ }

  const email = body.email ?? '';
  const name = body.name ?? '';

  if (!email || !name) {
    return NextResponse.json({ error: 'email and name are required' }, { status: 400 });
  }

  const { customerId } = await createCustomer(email, name, userId);

  // Persist to profiles
  if (supabaseConfigured && supabase) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  return NextResponse.json({ customerId });
}

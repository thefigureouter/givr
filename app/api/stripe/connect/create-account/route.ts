import { NextRequest, NextResponse } from 'next/server';
import { createConnectedAccount } from '@/lib/stripe';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: { charityId?: string; email?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const { charityId, email } = body;
  if (!charityId || !email) {
    return NextResponse.json({ error: 'charityId and email are required' }, { status: 400 });
  }

  const { accountId } = await createConnectedAccount(email, charityId);

  if (supabaseConfigured && supabase) {
    await supabase
      .from('charities')
      .update({ stripe_account_id: accountId })
      .eq('id', charityId);
  }

  return NextResponse.json({ accountId });
}

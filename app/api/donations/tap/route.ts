/**
 * POST /api/donations/tap
 *
 * Records a "tap/seed" micro-donation as a pending ledger entry.
 * Does NOT charge the card immediately — the user is on a budget or open plan
 * and will be charged in a weekly/monthly batch.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseConfigured, getCurrentUserId } from '@/lib/supabase';
import { randomId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { charityId, amountCents, privacyMode = 'PUBLIC' } = body as Record<string, unknown>;

  if (typeof charityId !== 'string' || !charityId.trim()) {
    return NextResponse.json({ error: 'charityId is required' }, { status: 400 });
  }
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 1) {
    return NextResponse.json({ error: 'amountCents must be a positive integer' }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  const safePrivacy = ['PUBLIC', 'FRIENDS', 'PRIVATE'].includes(String(privacyMode))
    ? String(privacyMode)
    : 'PUBLIC';

  if (supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        charity_id: charityId,
        amount_cents: amountCents,
        type: 'tap',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  // Mock fallback
  const txn = {
    id: 'txn_' + randomId(),
    userId,
    charityId,
    amountCents,
    privacyMode: safePrivacy,
    type: 'tap',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json(txn, { status: 201 });
}

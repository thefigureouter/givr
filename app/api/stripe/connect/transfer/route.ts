import { NextRequest, NextResponse } from 'next/server';
import { createTransfer } from '@/lib/stripe';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: { settlementId?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const { settlementId } = body;
  if (!settlementId) {
    return NextResponse.json({ error: 'settlementId is required' }, { status: 400 });
  }

  if (!supabaseConfigured || !supabase) {
    return NextResponse.json({ error: 'Supabase required for transfers' }, { status: 500 });
  }

  // Load settlement + charity stripe account
  const { data: settlement, error } = await supabase
    .from('settlements')
    .select('*, charity:charities(stripe_account_id)')
    .eq('id', settlementId)
    .single();

  if (error || !settlement) {
    return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
  }

  const s = settlement as Record<string, unknown>;
  const charity = s.charity as { stripe_account_id: string | null } | null;
  const stripeAccountId = charity?.stripe_account_id;

  if (!stripeAccountId) {
    return NextResponse.json({ error: 'Charity has no Stripe account' }, { status: 400 });
  }

  const { transferId } = await createTransfer(s.total_cents as number, stripeAccountId, settlementId);

  // Mark settlement completed
  await supabase
    .from('settlements')
    .update({ stripe_transfer_id: transferId, status: 'completed' })
    .eq('id', settlementId);

  // Mark transactions settled
  await supabase
    .from('transactions')
    .update({ status: 'settled' })
    .eq('settlement_id', settlementId);

  return NextResponse.json({ transferId });
}

/**
 * POST /api/cron/settle-charities
 *
 * Batch settlement job — runs weekly (or on demand).
 * Groups all pending "tap" transactions by charity, creates a settlement record,
 * then fires a Transfer to each charity's Stripe connected account.
 *
 * Protect with CRON_SECRET in production (e.g. Vercel Cron + Authorization header).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createTransfer } from '@/lib/stripe';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  // Simple bearer-token guard
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!supabaseConfigured || !supabase) {
    return NextResponse.json({ message: 'Supabase not configured — skipping settlement' });
  }

  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Aggregate pending taps by charity
  const { data: rows, error } = await supabase
    .from('transactions')
    .select('charity_id, amount_cents, id')
    .eq('status', 'pending')
    .eq('type', 'tap')
    .lte('created_at', periodEnd);

  if (error) {
    console.error('[settle-charities]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: 'No pending transactions to settle', settled: [] });
  }

  // Group by charity
  const grouped: Record<string, { totalCents: number; txnIds: string[] }> = {};
  for (const row of rows as { charity_id: string; amount_cents: number; id: string }[]) {
    if (!grouped[row.charity_id]) grouped[row.charity_id] = { totalCents: 0, txnIds: [] };
    grouped[row.charity_id].totalCents += row.amount_cents;
    grouped[row.charity_id].txnIds.push(row.id);
  }

  const results: { charityId: string; totalCents: number; transferId?: string; error?: string }[] = [];

  for (const [charityId, { totalCents, txnIds }] of Object.entries(grouped)) {
    try {
      // Look up charity's Stripe account
      const { data: charity } = await supabase
        .from('charities')
        .select('stripe_account_id')
        .eq('id', charityId)
        .single();

      const stripeAccountId = (charity as { stripe_account_id: string | null } | null)?.stripe_account_id;

      // Create settlement record
      const { data: settlement } = await supabase
        .from('settlements')
        .insert({
          charity_id: charityId,
          total_cents: totalCents,
          period_start: periodStart,
          period_end: periodEnd,
          status: 'pending',
        })
        .select()
        .single();

      const settlementId = (settlement as { id: string }).id;

      // Link transactions to settlement
      await supabase
        .from('transactions')
        .update({ settlement_id: settlementId })
        .in('id', txnIds);

      // Transfer if charity has a Stripe account
      if (stripeAccountId) {
        const { transferId } = await createTransfer(totalCents, stripeAccountId, settlementId);
        await supabase
          .from('settlements')
          .update({ stripe_transfer_id: transferId, status: 'completed' })
          .eq('id', settlementId);
        await supabase
          .from('transactions')
          .update({ status: 'settled' })
          .in('id', txnIds);
        results.push({ charityId, totalCents, transferId });
      } else {
        // No Stripe account yet — settlement stays pending
        results.push({ charityId, totalCents, error: 'No Stripe account' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[settle-charities] ${charityId}:`, msg);
      results.push({ charityId, totalCents, error: msg });
    }
  }

  return NextResponse.json({ settled: results });
}

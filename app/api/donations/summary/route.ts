/**
 * GET /api/donations/summary
 *
 * Returns aggregate stats for the current user:
 * total donated, count, unique charities, current streak, pending tap balance.
 */
import { NextResponse } from 'next/server';
import { getDonations, getStreak } from '@/lib/mock-db';
import { supabase, supabaseConfigured, getCurrentUserId } from '@/lib/supabase';

export async function GET() {
  const userId = await getCurrentUserId();

  const [donations, streak] = await Promise.all([
    getDonations(userId),
    getStreak(userId),
  ]);

  const totalCents = donations.reduce((s, d) => s + d.amountCents, 0);
  const uniqueCharities = new Set(donations.map((d) => d.charityId)).size;

  // Pending tap balance (transactions not yet charged)
  let pendingCents = 0;
  if (supabaseConfigured && supabase) {
    const { data } = await supabase
      .from('transactions')
      .select('amount_cents')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .eq('type', 'tap');
    if (data) {
      pendingCents = (data as { amount_cents: number }[]).reduce((s, r) => s + r.amount_cents, 0);
    }
  }

  return NextResponse.json({
    totalCents,
    donationCount: donations.length,
    uniqueCharities,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    pendingCents,
  });
}

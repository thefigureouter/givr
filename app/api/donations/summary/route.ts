/**
 * GET /api/donations/summary
 *
 * Returns aggregate stats for the current user:
 * total donated, count, unique charities, current streak, pending tap balance.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getDonations, getStreak } from '@/lib/mock-db';

async function getRequestUserId(req: NextRequest): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return 'demo-user-id'; // demo mode: no Supabase config
  const supabase = createServerClient(url, anonKey, {
    cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [donations, streak] = await Promise.all([
    getDonations(userId),
    getStreak(userId),
  ]);

  const totalCents = donations.reduce((s, d) => s + d.amountCents, 0);
  const uniqueCharities = new Set(donations.map((d) => d.charityId)).size;

  // Pending tap balance (transactions not yet charged)
  let pendingCents = 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey) {
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
    });
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

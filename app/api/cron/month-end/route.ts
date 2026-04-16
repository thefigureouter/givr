/**
 * POST /api/cron/month-end
 *
 * Handles unallocated budget for "budget" mode users at month end.
 * For each user on the budget plan:
 *   1. Sum their tapped donations this month
 *   2. Compute remaining budget
 *   3. Distribute remainder per their remainder_preference:
 *      - rollover  → carry forward (no action)
 *      - top_charity → tap the highest-weighted preference charity
 *      - split_even  → split evenly across all preference charities
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { randomId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!supabaseConfigured || !supabase) {
    return NextResponse.json({ message: 'Supabase not configured — skipping month-end' });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Load all budget-mode users with a monthly budget set
  const { data: budgetUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, monthly_budget_cents, remainder_preference')
    .eq('giving_mode', 'budget')
    .not('monthly_budget_cents', 'is', null);

  if (usersError || !budgetUsers) {
    return NextResponse.json({ error: usersError?.message ?? 'Failed to load users' }, { status: 500 });
  }

  const results: { userId: string; remainderCents: number; action: string }[] = [];

  for (const user of budgetUsers as {
    id: string;
    monthly_budget_cents: number;
    remainder_preference: string;
  }[]) {
    try {
      // Sum taps this month
      const { data: taps } = await supabase
        .from('transactions')
        .select('amount_cents')
        .eq('user_id', user.id)
        .in('type', ['tap', 'one_time', 'budget_remainder'])
        .gte('created_at', monthStart);

      const usedCents = ((taps ?? []) as { amount_cents: number }[]).reduce(
        (s, r) => s + r.amount_cents,
        0
      );
      const remainderCents = Math.max(0, user.monthly_budget_cents - usedCents);

      if (remainderCents < 100 || user.remainder_preference === 'rollover') {
        results.push({ userId: user.id, remainderCents, action: 'rollover' });
        continue;
      }

      // Load charity preferences
      const { data: prefs } = await supabase
        .from('user_charity_preferences')
        .select('charity_id, weight')
        .eq('user_id', user.id)
        .order('weight', { ascending: false });

      if (!prefs || (prefs as unknown[]).length === 0) {
        results.push({ userId: user.id, remainderCents, action: 'rollover (no preferences)' });
        continue;
      }

      type Pref = { charity_id: string; weight: number };
      const prefList = prefs as Pref[];

      if (user.remainder_preference === 'top_charity') {
        await supabase.from('transactions').insert({
          user_id: user.id,
          charity_id: prefList[0].charity_id,
          amount_cents: remainderCents,
          type: 'budget_remainder',
          status: 'pending',
        });
        results.push({ userId: user.id, remainderCents, action: `top_charity:${prefList[0].charity_id}` });
      } else if (user.remainder_preference === 'split_even') {
        const perCharity = Math.floor(remainderCents / prefList.length);
        if (perCharity >= 1) {
          const rows = prefList.map((p) => ({
            user_id: user.id,
            charity_id: p.charity_id,
            amount_cents: perCharity,
            type: 'budget_remainder',
            status: 'pending',
            idempotency_key: 'me_' + randomId(),
          }));
          await supabase.from('transactions').insert(rows);
          results.push({ userId: user.id, remainderCents, action: `split_even:${prefList.length} charities` });
        }
      }
    } catch (err) {
      console.error(`[month-end] user ${user.id}:`, err);
    }
  }

  return NextResponse.json({ processed: results });
}

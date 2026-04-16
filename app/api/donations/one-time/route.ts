/**
 * POST /api/donations/one-time
 *
 * Processes an immediate, intentional one-off donation.
 * Creates a PaymentIntent (with destination charge if charity has a Stripe account),
 * records the transaction, updates streak/badges, sends receipt.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
import { createDonation, getCharityById } from '@/lib/mock-db';
import { supabase, supabaseConfigured, getCurrentUserId } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { charityId, amountCents, privacyMode = 'PUBLIC' } = body as Record<string, unknown>;

  if (typeof charityId !== 'string' || !charityId.trim()) {
    return NextResponse.json({ error: 'charityId is required' }, { status: 400 });
  }
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: 'amountCents must be an integer >= 100' }, { status: 400 });
  }
  const safePrivacy = ['PUBLIC', 'FRIENDS', 'PRIVATE'].includes(String(privacyMode))
    ? (String(privacyMode) as 'PUBLIC' | 'FRIENDS' | 'PRIVATE')
    : 'PUBLIC';

  const userId = await getCurrentUserId();

  // Load user's Stripe customer + payment method for off-session charge
  let customerId: string | undefined;
  let paymentMethodId: string | undefined;
  let charityStripeAccountId: string | undefined;

  if (supabaseConfigured && supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_payment_method_id')
      .eq('id', userId)
      .single();
    if (profile) {
      const p = profile as { stripe_customer_id: string | null; stripe_payment_method_id: string | null };
      customerId = p.stripe_customer_id ?? undefined;
      paymentMethodId = p.stripe_payment_method_id ?? undefined;
    }

    // Load charity Stripe account for destination charge
    const { data: charity } = await supabase
      .from('charities')
      .select('stripe_account_id')
      .eq('id', charityId)
      .single();
    if (charity) {
      charityStripeAccountId = (charity as { stripe_account_id: string | null }).stripe_account_id ?? undefined;
    }
  }

  try {
    const { paymentIntentId, status } = await createPaymentIntent(amountCents, charityId, {
      customerId,
      paymentMethodId,
      stripeAccountId: charityStripeAccountId,
    });

    const donation = await createDonation({
      userId,
      charityId,
      amountCents,
      tipCents: 0,
      feeCents: 0,
      totalCents: amountCents,
      charityReceivesCents: amountCents,
      currency: 'usd',
      status: status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
      privacyMode: safePrivacy,
      fundingSource: paymentMethodId ? 'saved_card' : 'card',
      stripePaymentIntentId: paymentIntentId,
      donatedAt: new Date().toISOString(),
    });

    // Also write to transactions table
    if (supabaseConfigured && supabase) {
      await supabase.from('transactions').insert({
        user_id: userId,
        charity_id: charityId,
        amount_cents: amountCents,
        type: 'one_time',
        status: status === 'succeeded' ? 'settled' : 'pending',
        stripe_payment_intent_id: paymentIntentId,
      });
    }

    const charity = await getCharityById(charityId);

    return NextResponse.json({ donation, charity, paymentIntentId }, { status: 201 });
  } catch (err) {
    console.error('[one-time donation]', err);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}

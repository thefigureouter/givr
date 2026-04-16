import { NextRequest, NextResponse } from 'next/server';
import { createSetupIntent } from '@/lib/stripe';
import { supabase, supabaseConfigured, getCurrentUserId } from '@/lib/supabase';

export async function POST(_req: NextRequest) {
  const userId = await getCurrentUserId();

  // Look up the user's existing Stripe customer ID
  let customerId: string | null = null;

  if (supabaseConfigured && supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    customerId = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null;
  }

  if (!customerId) {
    return NextResponse.json(
      { error: 'No Stripe customer found. Call /api/stripe/create-customer first.' },
      { status: 400 }
    );
  }

  const { clientSecret, setupIntentId } = await createSetupIntent(customerId);
  return NextResponse.json({ clientSecret, setupIntentId });
}

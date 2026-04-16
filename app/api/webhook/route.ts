import { NextRequest, NextResponse } from 'next/server';
import { createDonation } from '@/lib/mock-db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    // Webhook not configured — ignore silently in dev
    return NextResponse.json({ received: true });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret) as typeof event;
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const metadata = pi.metadata as Record<string, string>;

    // Only create donation if not already created client-side
    // (idempotency is handled by the DB unique constraint on stripe_payment_intent_id)
    try {
      await createDonation({
        userId: metadata.userId ?? 'unknown',
        charityId: metadata.charityId ?? 'unknown',
        amountCents: pi.amount as number,
        tipCents: 0,
        feeCents: 0,
        totalCents: pi.amount as number,
        charityReceivesCents: pi.amount as number,
        currency: (pi.currency as string) ?? 'usd',
        status: 'SUCCEEDED',
        privacyMode: (metadata.privacyMode as 'PUBLIC' | 'FRIENDS' | 'PRIVATE') ?? 'PUBLIC',
        fundingSource: 'card',
        stripePaymentIntentId: pi.id as string,
        donatedAt: new Date().toISOString(),
      });
    } catch {
      // Duplicate — already recorded client-side, ignore
    }
  }

  return NextResponse.json({ received: true });
}

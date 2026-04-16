import { NextRequest, NextResponse } from 'next/server';
import { createDonation, getDonations } from '@/lib/mock-db';
import { createPaymentIntent, confirmPayment } from '@/lib/stripe';

export async function GET() {
  // TODO: [SUPABASE] Authenticate user from session
  const donations = await getDonations('demo-user-id');
  return NextResponse.json(donations);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { charityId, amountCents, privacyMode = 'PUBLIC' } = body as Record<string, unknown>;

  if (typeof charityId !== 'string' || !charityId.trim()) {
    return NextResponse.json({ error: 'charityId is required' }, { status: 400 });
  }
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: 'amountCents must be an integer >= 100' }, { status: 400 });
  }
  const validPrivacy = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
  const safePrivacy = validPrivacy.includes(String(privacyMode)) ? String(privacyMode) : 'PUBLIC';

  try {
    const { paymentIntentId } = await createPaymentIntent(amountCents, charityId);
    await confirmPayment(paymentIntentId);

    const donation = await createDonation({
      userId: 'demo-user-id', // TODO: [SUPABASE] Replace with session user ID
      charityId,
      amountCents,
      tipCents: 0,
      feeCents: 0,
      totalCents: amountCents,
      charityReceivesCents: amountCents,
      currency: 'usd',
      status: 'SUCCEEDED',
      privacyMode: safePrivacy as 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
      fundingSource: 'api',
      stripePaymentIntentId: paymentIntentId,
      donatedAt: new Date().toISOString(),
    });

    return NextResponse.json(donation, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createDonation, getDonations } from '@/lib/mock-db';
import { createPaymentIntent, confirmPayment } from '@/lib/stripe';

export async function GET() {
  // TODO: [SUPABASE] Authenticate user from session
  const donations = await getDonations('demo-user-id');
  return NextResponse.json(donations);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { charityId: string; amountCents: number; privacyMode?: string };
  const { charityId, amountCents, privacyMode = 'PUBLIC' } = body;

  const { paymentIntentId } = await createPaymentIntent(amountCents, charityId);
  await confirmPayment(paymentIntentId);

  const donation = await createDonation({
    userId: 'demo-user-id',
    charityId,
    amountCents,
    tipCents: 0,
    feeCents: 0,
    totalCents: amountCents,
    charityReceivesCents: amountCents,
    currency: 'usd',
    status: 'SUCCEEDED',
    privacyMode: privacyMode as 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
    fundingSource: 'api',
    stripePaymentIntentId: paymentIntentId,
    donatedAt: new Date().toISOString(),
  });

  return NextResponse.json(donation, { status: 201 });
}

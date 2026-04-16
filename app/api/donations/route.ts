import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createDonation, getDonations } from '@/lib/mock-db';
import { createPaymentIntent, confirmPayment } from '@/lib/stripe';

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
  const donations = await getDonations(userId);
  return NextResponse.json(donations);
}

export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      userId,
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

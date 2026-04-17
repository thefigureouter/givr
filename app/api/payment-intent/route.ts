import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createPaymentIntent } from '@/lib/stripe';

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

  const { charityId, amountCents, privacyMode } = body as Record<string, unknown>;

  if (typeof charityId !== 'string' || !charityId.trim()) {
    return NextResponse.json({ error: 'charityId is required' }, { status: 400 });
  }
  if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: 'amountCents must be an integer >= 100' }, { status: 400 });
  }

  // Resolve authenticated user so webhook can attribute the payment
  let userId = 'anonymous';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  }

  try {
    const result = await createPaymentIntent(amountCents, charityId, {
      extraMetadata: {
        userId,
        privacyMode: typeof privacyMode === 'string' ? privacyMode : 'PUBLIC',
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}

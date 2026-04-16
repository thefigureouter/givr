import { NextRequest, NextResponse } from 'next/server';
import { createAccountLink } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  let body: { accountId?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const { accountId } = body;
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const { url } = await createAccountLink(accountId, baseUrl);
  return NextResponse.json({ url });
}

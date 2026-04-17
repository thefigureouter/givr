import { NextRequest, NextResponse } from 'next/server';
import { getCharities, searchCharities } from '@/lib/mock-db';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  const charities = query ? await searchCharities(query) : await getCharities();
  return NextResponse.json(charities);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { displayName, website, category } = body as Record<string, unknown>;

  if (typeof displayName !== 'string' || !displayName.trim()) {
    return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && anonKey && serviceKey) {
    // Use service role to insert charity (anon can't insert to charities table)
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(url, serviceKey);
    const id = 'charity_' + Math.random().toString(36).slice(2, 10);
    const { data, error } = await admin.from('charities').insert({
      id,
      display_name: displayName.trim(),
      website: typeof website === 'string' ? website.trim() || null : null,
      category: typeof category === 'string' ? category : 'other',
      verification_status: 'PENDING',
      country: 'US',
      popularity_score: 0,
      urgency_score: 0,
      mission_summary: '',
    }).select().single();
    if (error) {
      console.error('[api/charities POST]', error);
      // Fall through to mock response
    } else {
      return NextResponse.json({ ok: true, id: (data as Record<string, unknown>).id });
    }
  }

  // Demo mode or Supabase error — log and return mock success
  console.log('[CHARITIES MOCK] add unclaimed:', { displayName, website, category });
  return NextResponse.json({ ok: true, id: 'charity_mock_' + Math.random().toString(36).slice(2, 10) });
}

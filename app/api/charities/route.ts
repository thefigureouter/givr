import { NextRequest, NextResponse } from 'next/server';
import { getCharities, searchCharities } from '@/lib/mock-db';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  const charities = query ? await searchCharities(query) : await getCharities();
  return NextResponse.json(charities);
}

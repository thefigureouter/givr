import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { DEMO_USER } from '@/lib/mock-data';

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  memberSince: string;
  cityRegion: string | null;
}

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Demo mode — Supabase not configured
  if (!url || !anonKey) {
    return NextResponse.json<MeResponse>({
      id: DEMO_USER.id,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      username: DEMO_USER.username ?? '',
      bio: DEMO_USER.bio ?? '',
      memberSince: DEMO_USER.memberSince,
      cityRegion: DEMO_USER.cityRegion ?? null,
    });
  }

  // Server-side session read — reads from request cookies, never touches document.cookie
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll() {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ id: null }, { status: 401 });
  }

  // Fetch profile row
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, username, member_since, bio, city_region')
    .eq('id', user.id)
    .single();

  // Profile row missing (trigger didn't fire or user pre-dates it) — create it now
  if (!profile) {
    const name =
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      'User';
    await supabase
      .from('profiles')
      .upsert({ id: user.id, name, email: user.email ?? '' });
    return NextResponse.json<MeResponse>({
      id: user.id,
      name,
      email: user.email ?? '',
      username: '',
      bio: '',
      memberSince: user.created_at ?? new Date().toISOString(),
      cityRegion: null,
    });
  }

  const p = profile as {
    name: string;
    email: string;
    username: string | null;
    member_since: string;
    bio: string | null;
    city_region: string | null;
  };

  return NextResponse.json<MeResponse>({
    id: user.id,
    name: p.name || (user.user_metadata?.name as string | undefined) || user.email || 'User',
    email: p.email || user.email || '',
    username: p.username ?? '',
    bio: p.bio ?? '',
    memberSince: p.member_since,
    cityRegion: p.city_region,
  });
}

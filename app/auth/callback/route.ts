import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  // `next` is set when user was mid-navigation before login; not present on email confirmation links
  const next = req.nextUrl.searchParams.get('next');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!code || !url || !anonKey) {
    return NextResponse.redirect(new URL(next ?? '/home', req.url));
  }

  // Buffer cookies set during exchangeCodeForSession so we can apply them
  // after we decide the final redirect target.
  type CookieEntry = { name: string; value: string; options: Record<string, unknown> };
  const cookieBuffer: CookieEntry[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((c) =>
          cookieBuffer.push({ name: c.name, value: c.value, options: c.options as Record<string, unknown> })
        );
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);

  // Decide where to send the user
  let redirectPath = next ?? '/home';

  if (!next) {
    // No explicit `next` — check if this is a new user who needs onboarding
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      if (!profile?.onboarding_complete) {
        redirectPath = '/onboarding';
      }
    }
  }

  const response = NextResponse.redirect(new URL(redirectPath, req.url));
  cookieBuffer.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  );
  return response;
}

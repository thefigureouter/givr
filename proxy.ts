import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/home', '/explore', '/donate', '/feed', '/history', '/impact', '/settings', '/onboarding'];
const AUTH_PAGES = ['/login', '/signup'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Demo mode (no Supabase keys) — allow everything through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Only run auth check on protected/auth pages
  if (!isProtected && !isAuthPage) return NextResponse.next();

  // Build a mutable response so @supabase/ssr can refresh session cookies
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT server-side (no cookie spoofing)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)',],
};

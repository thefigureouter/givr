import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/home', '/explore', '/donate', '/feed', '/history', '/impact', '/settings', '/onboarding'];
const AUTH_PAGES = ['/login', '/signup'];
const supabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // When Supabase is not configured, run in demo mode — allow everything
  if (!supabaseConfigured) return NextResponse.next();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Read the Supabase session cookie (set by supabase-js)
  const hasSession =
    req.cookies.has('sb-access-token') ||
    req.cookies.has(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`);

  if (isProtected && !hasSession) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = '/home';
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

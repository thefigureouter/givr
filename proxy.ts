import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/home', '/explore', '/donate', '/feed', '/history', '/impact', '/settings', '/onboarding'];
const AUTH_PAGES = ['/login', '/signup'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Demo mode (no Supabase keys) — allow everything through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Supabase sets a cookie whose name starts with "sb-" and ends with "-auth-token"
  const hasSession = [...req.cookies.getAll()].some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)',],
};

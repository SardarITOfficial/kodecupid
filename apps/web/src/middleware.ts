import { NextResponse, type NextRequest } from 'next/server';

/**
 * Coarse cookie gate for navigation only. The API remains the source of truth:
 * an expired or forged cookie still gets a 401 from the server.
 *
 * Cookie names mirror `MEMBER_COOKIE` / `ADMIN_COOKIE` in packages/shared.
 */
const MEMBER_COOKIE = 'kc_at';
const ADMIN_COOKIE = 'kc_admin_at';

const MEMBER_PREFIXES = ['/app', '/profile', '/settings', '/onboarding'];
const ADMIN_PUBLIC_PATHS = ['/admin/login', '/admin/accept-invite'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (ADMIN_PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    if (!request.cookies.get(ADMIN_COOKIE)) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (MEMBER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (!request.cookies.get(MEMBER_COOKIE)) {
      const url = new URL('/login', request.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/profile/:path*', '/settings/:path*', '/onboarding/:path*', '/admin/:path*'],
};

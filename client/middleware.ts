import { NextResponse, type NextRequest } from 'next/server';

const AUTHENTICATED_ROUTES = ['/dashboard', '/performance', '/account'];
const ADMIN_ROUTES = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshCookie = request.cookies.has('refreshToken');

  if (
    [...AUTHENTICATED_ROUTES, ...ADMIN_ROUTES].some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) &&
    !hasRefreshCookie
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

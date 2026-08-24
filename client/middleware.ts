import { NextResponse, type NextRequest } from 'next/server';

const AUTH_RESERVED_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/account',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTH_RESERVED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

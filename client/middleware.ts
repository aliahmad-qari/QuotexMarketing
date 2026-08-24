import { NextResponse } from 'next/server';

export function middleware() {
  // Auth is enforced by the API and ProtectedRoute. In production the HttpOnly
  // refresh cookie belongs to the API host, so Vercel middleware cannot inspect it.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

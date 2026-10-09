import { NextRequest, NextResponse } from 'next/server';

import { PROTECTED_PATHS, AUTH_PATHS } from './constants/routes';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get('refresh_token'));

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/settings/:path*', '/login', '/register'],
};

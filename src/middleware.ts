import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('komuna_session');
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication
  const isAuthPage = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicFile = pathname.includes('.') || pathname.startsWith('/_next/');

  if (isApiRoute || isPublicFile) {
    return NextResponse.next();
  }

  if (!session && !isAuthPage) {
    // If not logged in and not on login page, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthPage) {
    // If logged in and on login page, redirect to dashboard
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Matching paths configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

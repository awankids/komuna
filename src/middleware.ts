import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function hasValidSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('komuna_session');
  if (!sessionCookie || !sessionCookie.value) {
    return false;
  }

  // Handle both URL-encoded and raw JSON cookie values defensively
  try {
    const decoded = decodeURIComponent(sessionCookie.value);
    const parsed = JSON.parse(decoded);
    return Boolean(parsed && (parsed.id || parsed.nama));
  } catch {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      return Boolean(parsed && (parsed.id || parsed.nama));
    } catch {
      return false;
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication check
  const isAuthPage = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicFile = 
    pathname.includes('.') || 
    pathname.startsWith('/_next/') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest';

  if (isApiRoute || isPublicFile) {
    return NextResponse.next();
  }

  const isAuthenticated = hasValidSession(request);

  if (!isAuthenticated && !isAuthPage) {
    // If not logged in and not on login page, redirect to login
    const loginUrl = new URL('/login', request.url);
    if (pathname && pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPage) {
    // If logged in and on login page, redirect to dashboard or original target
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const targetUrl = new URL(redirectParam && redirectParam.startsWith('/') ? redirectParam : '/', request.url);
    return NextResponse.redirect(targetUrl);
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
     * - sw.js (service worker)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};

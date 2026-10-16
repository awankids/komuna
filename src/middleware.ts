import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth-token';

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return false;
  }

  // 1. Verify signed cryptographic token
  const verifiedUser = await verifySessionToken(sessionCookie.value);
  if (verifiedUser) {
    return true;
  }

  // 2. Legacy unencrypted session fallback (seamless transition)
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication check
  const isAuthPage = pathname === '/login';
  const isPublicVerification = pathname.startsWith('/verifikasi-surat');
  const isPublicFile = 
    pathname.includes('.') || 
    pathname.startsWith('/_next/') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest';

  if (isPublicFile || isPublicVerification) {
    return NextResponse.next();
  }

  // Public API endpoints whitelist
  const isPublicApi = 
    pathname === '/api/auth/login' ||
    (pathname === '/api/config' && request.method === 'GET') ||
    pathname.startsWith('/api/surat/verifikasi') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/webhooks');

  if (isPublicApi) {
    return NextResponse.next();
  }

  const isAuthenticated = await hasValidSession(request);

  // If this is an API route and not authenticated, return 401 JSON
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid atau telah berakhir' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // If web page not logged in and not on login page, redirect to login
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    if (pathname && pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and on login page, redirect to dashboard or original target
  if (isAuthenticated && isAuthPage) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const targetUrl = new URL(redirectParam && redirectParam.startsWith('/') ? redirectParam : '/', request.url);
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
}

// Matching paths configuration - intercept all routes except static assets and service workers
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};

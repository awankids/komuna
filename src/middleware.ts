import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken, type SessionUser } from '@/lib/auth-token';

async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  // 1. Verify signed cryptographic token
  const verifiedUser = await verifySessionToken(sessionCookie.value);
  if (verifiedUser) {
    return verifiedUser;
  }

  // 2. Legacy unencrypted session fallback (seamless transition)
  try {
    const decoded = decodeURIComponent(sessionCookie.value);
    const parsed = JSON.parse(decoded);
    if (parsed && (parsed.id || parsed.nama)) {
      return {
        id: parsed.id || 'legacy',
        nama: parsed.nama || 'Pengguna',
        email: parsed.email || '',
        role: (parsed.role || 'ADMIN').toUpperCase(),
      };
    }
  } catch {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      if (parsed && (parsed.id || parsed.nama)) {
        return {
          id: parsed.id || 'legacy',
          nama: parsed.nama || 'Pengguna',
          email: parsed.email || '',
          role: (parsed.role || 'ADMIN').toUpperCase(),
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

const RBAC_PAGE_RESTRICTIONS: { prefix: string; roles: string[] }[] = [
  { prefix: '/pengaturan', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/kas', roles: ['SUPER_ADMIN', 'ADMIN', 'BENDAHARA'] },
  { prefix: '/hutang-piutang', roles: ['SUPER_ADMIN', 'ADMIN', 'BENDAHARA'] },
  { prefix: '/anggota', roles: ['SUPER_ADMIN', 'ADMIN', 'SEKRETARIS'] },
  { prefix: '/laporan', roles: ['SUPER_ADMIN', 'ADMIN', 'BENDAHARA', 'SEKRETARIS'] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication check
  const isLoginPage = pathname === '/login';
  const isPublicPage = isLoginPage || pathname === '/demo' || pathname === '/daftar';
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
    pathname === '/api/auth/demo' ||
    pathname === '/api/auth/register-rt' ||
    (pathname === '/api/config' && request.method === 'GET') ||
    pathname.startsWith('/api/surat/verifikasi') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/webhooks');

  if (isPublicApi) {
    return NextResponse.next();
  }

  const sessionUser = await getSessionUser(request);
  const isAuthenticated = Boolean(sessionUser);

  // If this is an API route and not authenticated, return 401 JSON
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid atau telah berakhir' },
        { status: 401 }
      );
    }

    // Role-based authorization for API endpoints
    const userRole = (sessionUser?.role || 'WARGA').toUpperCase();
    if (userRole !== 'SUPER_ADMIN') {
      const isRestrictedAdminApi = 
        pathname.startsWith('/api/users') || 
        pathname.startsWith('/api/backup') || 
        (pathname === '/api/config' && request.method !== 'GET');

      if (isRestrictedAdminApi && userRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden: Anda tidak memiliki hak akses untuk tindakan ini' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // If web page not logged in and not on a public page, redirect to login
  if (!isAuthenticated && !isPublicPage) {
    const loginUrl = new URL('/login', request.url);
    if (pathname && pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and on login page, redirect to dashboard or original target
  if (isAuthenticated && isLoginPage) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const targetUrl = new URL(redirectParam && redirectParam.startsWith('/') ? redirectParam : '/', request.url);
    return NextResponse.redirect(targetUrl);
  }

  // Role-based authorization for Page routes
  if (isAuthenticated && sessionUser) {
    const userRole = (sessionUser.role || 'WARGA').toUpperCase();
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      const restrictedMatch = RBAC_PAGE_RESTRICTIONS.find(
        rule => pathname === rule.prefix || pathname.startsWith(rule.prefix + '/')
      );

      if (restrictedMatch && !restrictedMatch.roles.includes(userRole)) {
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('unauthorized', '1');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.next();
}

// Matching paths configuration - intercept all routes except static assets and service workers
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};

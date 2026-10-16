import { NextResponse } from 'next/server';
import { clearSessionCookies } from '@/lib/auth';

export async function POST() {
  await clearSessionCookies();
  
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar' });
  
  // Also explicitly expire cookies in response header for thoroughness
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set('komuna_session', '', {
    path: '/',
    sameSite: 'lax',
    secure: isProd,
    maxAge: 0,
  });
  response.cookies.set('komuna_user', '', {
    path: '/',
    sameSite: 'lax',
    secure: isProd,
    maxAge: 0,
  });
  
  return response;
}

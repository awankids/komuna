import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar' });
  
  // Clear the komuna_session cookie by setting maxAge to 0
  response.cookies.set('komuna_session', '', {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
  
  return response;
}

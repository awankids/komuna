import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar' });
  
  // Clear the komuna_session cookie by setting maxAge to 0
  response.cookies.set('komuna_session', '', {
    path: '/',
    maxAge: 0,
  });
  
  return response;
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }
    
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    const user = await db.user.findUnique({
      where: { email },
    });
    
    if (!user || user.passwordHash !== hash) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }
    
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role } 
    });
    
    const sessionData = {
      id: user.id,
      nama: user.nama,
      role: user.role,
    };

    response.cookies.set('komuna_session', encodeURIComponent(JSON.stringify(sessionData)), {
      path: '/',
      httpOnly: false, // Accessible by client-side router for simplicity
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    return response;
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword, setSessionCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Email atau kata sandi salah' }, { status: 401 });
    }
    
    const { valid, needsRehash } = verifyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: 'Email atau kata sandi salah' }, { status: 401 });
    }
    
    // Transparently upgrade legacy SHA-256 hash to modern salted scrypt hash
    if (needsRehash) {
      try {
        const newSaltedHash = hashPassword(password);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: newSaltedHash },
        });
      } catch (err) {
        console.warn('Failed to upgrade password hash:', err);
      }
    }
    
    // Set secure HTTP-Only session token & client display cookie
    await setSessionCookies({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    });
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        nama: user.nama, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat proses login' }, { status: 500 });
  }
}

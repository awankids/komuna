import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword, setSessionCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const identifier = (email || '').trim();
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email atau Nomor HP serta kata sandi wajib diisi' }, { status: 400 });
    }
    
    const normalized = identifier.toLowerCase();
    
    // Allow login via email OR WhatsApp/Phone number with prefix tolerance
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: normalized },
          { noHp: identifier },
          { noHp: identifier.replace(/^0/, '+62') },
          { noHp: identifier.replace(/^\+62/, '0') },
        ],
      },
      include: {
        komunitas: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Email/Nomor HP atau kata sandi salah' }, { status: 401 });
    }

    if (user.statusAktif === false) {
      return NextResponse.json({ error: 'Akun Anda dinonaktifkan oleh Administrator' }, { status: 403 });
    }
    
    const { valid, needsRehash } = verifyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: 'Email/Nomor HP atau kata sandi salah' }, { status: 401 });
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
      komunitasId: user.komunitasId,
      komunitasNama: user.komunitas?.nama || null,
      jabatan: user.jabatan || null,
    });
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        nama: user.nama, 
        email: user.email, 
        role: user.role,
        komunitasId: user.komunitasId,
        komunitasNama: user.komunitas?.nama || null,
        jabatan: user.jabatan || null,
      } 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat proses login' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('komuna_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak ada sesi aktif' }, { status: 401 });
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    const userId = session.id;

    if (!userId) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { nama, passwordLama, passwordBaru } = body;

    if (!nama || nama.trim() === '') {
      return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    let updateData: any = { nama: nama.trim() };

    // Jika ingin mengganti password
    if (passwordLama && passwordBaru) {
      const oldHash = crypto.createHash('sha256').update(passwordLama).digest('hex');
      if (user.passwordHash !== oldHash) {
        return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
      }
      const newHash = crypto.createHash('sha256').update(passwordBaru).digest('hex');
      updateData.passwordHash = newHash;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData
    });

    const response = NextResponse.json({ success: true });
    
    // Perbarui cookie dengan nama baru
    response.cookies.set('komuna_session', JSON.stringify({
      id: updatedUser.id,
      nama: updatedUser.nama,
      role: updatedUser.role,
    }), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('komuna_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak ada sesi aktif' }, { status: 401 });
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    const userId = session.id;

    if (!userId) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    const user = await db.user.findUnique({ 
      where: { id: userId },
      select: { id: true, nama: true, email: true, role: true, createdAt: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

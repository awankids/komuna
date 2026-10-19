import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  getServerSession, 
  verifyPassword, 
  hashPassword, 
  setSessionCookies 
} from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Tidak ada sesi aktif' }, { status: 401 });
    }

    const user = await db.user.findUnique({ 
      where: { id: session.id },
      select: { 
        id: true, 
        nama: true, 
        email: true, 
        role: true, 
        noHp: true,
        jabatan: true,
        komunitasId: true,
        komunitas: {
          select: {
            id: true,
            nama: true,
            tingkatWilayah: true,
            slug: true,
            desaKelurahan: true,
            kecamatan: true,
            kotaKabupaten: true,
            provinsi: true,
          },
        },
        createdAt: true 
      }
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

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Tidak ada sesi aktif' }, { status: 401 });
    }

    const body = await request.json();
    const { nama, passwordLama, passwordBaru } = body;

    if (!nama || nama.trim() === '') {
      return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    let updateData: any = { nama: nama.trim() };

    // Jika ingin mengganti kata sandi
    if (passwordBaru) {
      if (!passwordLama) {
        return NextResponse.json({ error: 'Kata sandi lama wajib diisi' }, { status: 400 });
      }

      const { valid } = verifyPassword(passwordLama, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Kata sandi lama salah' }, { status: 400 });
      }

      if (passwordBaru.length < 6) {
        return NextResponse.json({ error: 'Kata sandi baru minimal 6 karakter' }, { status: 400 });
      }

      updateData.passwordHash = hashPassword(passwordBaru);
    }

    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: updateData,
      include: {
        komunitas: true,
      },
    });

    // Refresh secure cookies with updated name
    await setSessionCookies({
      id: updatedUser.id,
      nama: updatedUser.nama,
      email: updatedUser.email,
      role: updatedUser.role,
      komunitasId: updatedUser.komunitasId,
      komunitasNama: updatedUser.komunitas?.nama,
      jabatan: updatedUser.jabatan,
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        nama: updatedUser.nama,
        email: updatedUser.email,
        role: updatedUser.role,
        jabatan: updatedUser.jabatan,
        komunitasId: updatedUser.komunitasId,
      }
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memperbarui profil' }, { status: 500 });
  }
}

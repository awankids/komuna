import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all anggota
export async function GET() {
  try {
    const anggota = await db.anggota.findMany({
      include: { rombongan: true },
      orderBy: { nama: 'asc' },
    });
    return NextResponse.json(anggota);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengambil data anggota' }, { status: 500 });
  }
}

// POST new anggota
export async function POST(request: Request) {
  try {
    const { nama, noRumah, noHp, rombonganId } = await request.json();
    
    if (!nama || !noRumah) {
      return NextResponse.json({ error: 'Nama dan Nomor Rumah wajib diisi' }, { status: 400 });
    }
    
    const newAnggota = await db.anggota.create({
      data: { 
        nama, 
        noRumah, 
        noHp, 
        rombonganId: rombonganId === 'none' ? null : (rombonganId || null), 
        statusAktif: true 
      },
    });
    
    return NextResponse.json(newAnggota, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menambahkan anggota baru' }, { status: 500 });
  }
}

// PUT / UPDATE anggota
export async function PUT(request: Request) {
  try {
    const { id, nama, noRumah, noHp, rombonganId, statusAktif } = await request.json();
    
    if (!id || !nama || !noRumah) {
      return NextResponse.json({ error: 'ID, Nama, dan Nomor Rumah wajib diisi' }, { status: 400 });
    }
    
    const updated = await db.anggota.update({
      where: { id },
      data: { 
        nama, 
        noRumah, 
        noHp, 
        rombonganId: rombonganId === 'none' ? null : (rombonganId || null), 
        statusAktif 
      },
    });
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memperbarui data anggota' }, { status: 500 });
  }
}

// DELETE anggota
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib dicantumkan' }, { status: 400 });
    }
    
    await db.anggota.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menghapus anggota' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kelompokId } = await params;
    const body = await request.json();

    const kelompok = await db.kelompokArisan.findUnique({
      where: { id: kelompokId },
      include: { peserta: true },
    });

    if (!kelompok) {
      return NextResponse.json(
        { success: false, error: 'Kelompok arisan tidak ditemukan' },
        { status: 404 }
      );
    }

    const rawList = Array.isArray(body.pesertaList) ? body.pesertaList : [body];
    const createdItems = [];

    for (const item of rawList) {
      const nama = (item.namaPeserta || item.nama || '').trim();
      if (!nama) continue;

      const created = await db.pesertaArisan.create({
        data: {
          kelompokId,
          namaPeserta: nama,
          anggotaId: item.anggotaId || null,
          nomorSlot: Number(item.nomorSlot) || 1,
          noHp: item.noHp?.trim() || null,
          sudahMenang: false,
        },
      });
      createdItems.push(created);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${createdItems.length} peserta`,
      data: createdItems,
    });
  } catch (error: any) {
    console.error('Error adding peserta arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan peserta', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kelompokId } = await params;
    const { searchParams } = new URL(request.url);
    const pesertaId = searchParams.get('pesertaId');

    if (!pesertaId) {
      return NextResponse.json(
        { success: false, error: 'ID peserta wajib disertakan' },
        { status: 400 }
      );
    }

    await db.pesertaArisan.delete({
      where: {
        id: pesertaId,
        kelompokId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Peserta berhasil dihapus dari kelompok arisan',
    });
  } catch (error: any) {
    console.error('Error deleting peserta arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus peserta', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Reset siklus (semua peserta dijadikan belum menang kembali)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kelompokId } = await params;
    const body = await request.json();
    const { action } = body; // "reset_siklus"

    if (action === 'reset_siklus') {
      await db.pesertaArisan.updateMany({
        where: { kelompokId },
        data: {
          sudahMenang: false,
          tanggalMenang: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Siklus arisan berhasil di-reset. Semua peserta siap diundi kembali!',
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    console.error('Error resetting arisan cycle:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal me-reset siklus arisan', details: error.message },
      { status: 500 }
    );
  }
}

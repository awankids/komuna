import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const kelompok = await db.kelompokArisan.findUnique({
      where: { id },
      include: {
        peserta: {
          orderBy: [{ nomorSlot: 'asc' }, { namaPeserta: 'asc' }],
          include: {
            anggota: {
              select: {
                id: true,
                nama: true,
                noRumah: true,
                noHp: true,
              },
            },
          },
        },
        putaran: {
          orderBy: { putaranKe: 'desc' },
          include: {
            pemenang: true,
            pembayaran: {
              include: {
                peserta: true,
              },
              orderBy: { peserta: { namaPeserta: 'asc' } },
            },
          },
        },
      },
    });

    if (!kelompok) {
      return NextResponse.json(
        { success: false, error: 'Kelompok arisan tidak ditemukan' },
        { status: 404 }
      );
    }

    const totalPeserta = kelompok.peserta.length;
    const pesertaSudahMenang = kelompok.peserta.filter((p) => p.sudahMenang);
    const pesertaBelumMenang = kelompok.peserta.filter((p) => !p.sudahMenang);
    const totalPutaranSelesai = kelompok.putaran.length;
    const estimasiHadiah = totalPeserta * kelompok.nominalIuran;

    // Check if whole cycle is completed
    const siklusSelesai = totalPeserta > 0 && pesertaBelumMenang.length === 0;

    return NextResponse.json({
      success: true,
      data: {
        ...kelompok,
        stats: {
          totalPeserta,
          totalSudahMenang: pesertaSudahMenang.length,
          totalBelumMenang: pesertaBelumMenang.length,
          totalPutaranSelesai,
          estimasiHadiah,
          siklusSelesai,
        },
        pesertaBelumMenang,
        pesertaSudahMenang,
      },
    });
  } catch (error: any) {
    console.error('Error fetching detail arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail arisan', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, nominalIuran, periodeTipe, status, keterangan } = body;

    const existing = await db.kelompokArisan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kelompok arisan tidak ditemukan' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (nama !== undefined) updateData.nama = nama.trim();
    if (nominalIuran !== undefined) updateData.nominalIuran = Number(nominalIuran);
    if (periodeTipe !== undefined) updateData.periodeTipe = periodeTipe;
    if (status !== undefined) updateData.status = status;
    if (keterangan !== undefined) updateData.keterangan = keterangan?.trim() || null;

    const updated = await db.kelompokArisan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui kelompok arisan', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.kelompokArisan.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Kelompok arisan berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus kelompok arisan', details: error.message },
      { status: 500 }
    );
  }
}

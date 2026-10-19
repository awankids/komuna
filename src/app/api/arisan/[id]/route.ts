import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { id } = await params;

    const kelompok = await db.kelompokArisan.findFirst({
      where: { id, komunitasId: tenant.komunitasId },
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
            agenda: {
              select: {
                id: true,
                judul: true,
                tanggal: true,
                lokasi: true,
                status: true,
              },
            },
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
    const tenant = await requireTenantContext();
    const { id } = await params;
    const body = await request.json();
    const {
      nama,
      nominalIuran,
      periodeTipe,
      hariJawa,
      waktuKocok,
      lokasiKocok,
      autoSinkronAgenda,
      status,
      keterangan,
    } = body;

    const existing = await db.kelompokArisan.findFirst({
      where: { id, komunitasId: tenant.komunitasId },
    });
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
    if (hariJawa !== undefined) updateData.hariJawa = hariJawa?.trim() || null;
    if (waktuKocok !== undefined) updateData.waktuKocok = waktuKocok?.trim() || null;
    if (lokasiKocok !== undefined) updateData.lokasiKocok = lokasiKocok?.trim() || null;
    if (autoSinkronAgenda !== undefined) updateData.autoSinkronAgenda = Boolean(autoSinkronAgenda);
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
    const tenant = await requireTenantContext();
    const { id } = await params;

    const existing = await db.kelompokArisan.findFirst({
      where: { id, komunitasId: tenant.komunitasId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kelompok arisan tidak ditemukan' },
        { status: 404 }
      );
    }

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

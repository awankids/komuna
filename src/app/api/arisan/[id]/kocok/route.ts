import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kelompokId } = await params;
    const body = await request.json();
    const {
      pemenangId,
      nominalDiterima,
      catatan,
      tanggalKocok = new Date().toISOString(),
      dicatatOleh = 'Pengurus RT',
      pembayaranStatus = [], // optional array of { pesertaId, statusBayar }
    } = body;

    if (!pemenangId) {
      return NextResponse.json(
        { success: false, error: 'ID pemenang wajib dipilih dari hasil undian' },
        { status: 400 }
      );
    }

    const kelompok = await db.kelompokArisan.findUnique({
      where: { id: kelompokId },
      include: {
        peserta: true,
        putaran: {
          orderBy: { putaranKe: 'desc' },
          take: 1,
        },
      },
    });

    if (!kelompok) {
      return NextResponse.json(
        { success: false, error: 'Kelompok arisan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify winner
    const pemenang = kelompok.peserta.find((p) => p.id === pemenangId);
    if (!pemenang) {
      return NextResponse.json(
        { success: false, error: 'Peserta pemenang tidak terdaftar dalam kelompok ini' },
        { status: 400 }
      );
    }

    const latestPutaranNumber = kelompok.putaran.length > 0 ? kelompok.putaran[0].putaranKe : 0;
    const nextPutaranKe = latestPutaranNumber + 1;

    const totalHadiah =
      nominalDiterima !== undefined
        ? Number(nominalDiterima)
        : kelompok.peserta.length * kelompok.nominalIuran;

    // Execute in Prisma transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Update Peserta: set sudahMenang = true
      await tx.pesertaArisan.update({
        where: { id: pemenangId },
        data: {
          sudahMenang: true,
          tanggalMenang: new Date(tanggalKocok),
        },
      });

      // 2. Create PutaranArisan
      const newPutaran = await tx.putaranArisan.create({
        data: {
          kelompokId,
          putaranKe: nextPutaranKe,
          tanggalKocok: new Date(tanggalKocok),
          pemenangId,
          namaPemenang: pemenang.namaPeserta,
          nominalDiterima: totalHadiah,
          totalTerkumpul: 0,
          status: 'terlaksana',
          catatan: catatan?.trim() || null,
          dicatatOleh,
        },
      });

      // 3. Generate initial PembayaranIuranArisan rows for all participants
      const statusMap = new Map<string, boolean>();
      if (Array.isArray(pembayaranStatus)) {
        pembayaranStatus.forEach((ps: any) => {
          if (ps.pesertaId) statusMap.set(ps.pesertaId, Boolean(ps.statusBayar));
        });
      }

      let totalTerkumpul = 0;
      const pembayaranRows = kelompok.peserta.map((p) => {
        const isPaid = statusMap.get(p.id) ?? false;
        if (isPaid) totalTerkumpul += kelompok.nominalIuran;
        return {
          putaranId: newPutaran.id,
          pesertaId: p.id,
          nominal: kelompok.nominalIuran,
          statusBayar: isPaid,
          tanggalBayar: isPaid ? new Date(tanggalKocok) : null,
          metode: 'tunai',
        };
      });

      await tx.pembayaranIuranArisan.createMany({
        data: pembayaranRows,
      });

      // Update totalTerkumpul if any were pre-paid
      if (totalTerkumpul > 0) {
        await tx.putaranArisan.update({
          where: { id: newPutaran.id },
          data: { totalTerkumpul },
        });
      }

      return newPutaran;
    });

    return NextResponse.json({
      success: true,
      message: `Selamat kepada ${pemenang.namaPeserta} telah terpilih sebagai pemenang putaran ke-${nextPutaranKe}!`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error saving kocokan arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan hasil undian arisan', details: error.message },
      { status: 500 }
    );
  }
}

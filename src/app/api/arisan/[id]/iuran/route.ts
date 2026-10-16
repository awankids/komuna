import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kelompokId } = await params;
    const body = await request.json();
    const { putaranId, pembayaranId, statusBayar, metode, pembayaranList } = body;

    if (!putaranId) {
      return NextResponse.json(
        { success: false, error: 'putaranId wajib disertakan' },
        { status: 400 }
      );
    }

    if (Array.isArray(pembayaranList)) {
      // Bulk update
      for (const item of pembayaranList) {
        if (!item.id) continue;
        await db.pembayaranIuranArisan.update({
          where: { id: item.id },
          data: {
            statusBayar: Boolean(item.statusBayar),
            tanggalBayar: item.statusBayar ? new Date() : null,
            metode: item.metode || 'tunai',
          },
        });
      }
    } else if (pembayaranId) {
      // Single update
      await db.pembayaranIuranArisan.update({
        where: { id: pembayaranId },
        data: {
          statusBayar: Boolean(statusBayar),
          tanggalBayar: statusBayar ? new Date() : null,
          metode: metode || 'tunai',
        },
      });
    }

    // Recalculate totalTerkumpul for this putaran
    const allPaid = await db.pembayaranIuranArisan.findMany({
      where: { putaranId, statusBayar: true },
      select: { nominal: true },
    });

    const totalTerkumpul = allPaid.reduce((acc, curr) => acc + curr.nominal, 0);

    const updatedPutaran = await db.putaranArisan.update({
      where: { id: putaranId },
      data: { totalTerkumpul },
      include: {
        pembayaran: {
          include: { peserta: true },
          orderBy: { peserta: { namaPeserta: 'asc' } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Status pembayaran iuran berhasil diperbarui',
      data: updatedPutaran,
    });
  } catch (error: any) {
    console.error('Error updating iuran arisan:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui iuran arisan', details: error.message },
      { status: 500 }
    );
  }
}

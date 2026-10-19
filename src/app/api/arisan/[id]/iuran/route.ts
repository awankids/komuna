import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenantContext } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenantContext();
    const { id: kelompokId } = await params;

    const kelompok = await db.kelompokArisan.findFirst({
      where: { id: kelompokId, komunitasId: tenant.komunitasId },
    });

    if (!kelompok) {
      return NextResponse.json(
        { success: false, error: 'Kelompok arisan tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      putaranId,
      pembayaranId,
      statusBayar,
      statusKehadiran,
      metode,
      catatan,
      pembayaranList,
      statusTalangan,
      nominalDiserahkan: customDiserahkan,
    } = body;

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
        const updateData: any = {};
        if (item.statusBayar !== undefined) {
          updateData.statusBayar = Boolean(item.statusBayar);
          updateData.tanggalBayar = item.statusBayar ? new Date() : null;
        }
        if (item.statusKehadiran !== undefined) {
          updateData.statusKehadiran = item.statusKehadiran;
        }
        if (item.metode !== undefined) {
          updateData.metode = item.metode || 'tunai';
        }
        if (item.catatan !== undefined) {
          updateData.catatan = item.catatan || null;
        }

        await db.pembayaranIuranArisan.update({
          where: { id: item.id },
          data: updateData,
        });
      }
    } else if (pembayaranId) {
      // Single update
      const updateData: any = {};
      if (statusBayar !== undefined) {
        updateData.statusBayar = Boolean(statusBayar);
        updateData.tanggalBayar = statusBayar ? new Date() : null;
      }
      if (statusKehadiran !== undefined) {
        updateData.statusKehadiran = statusKehadiran;
      }
      if (metode !== undefined) {
        updateData.metode = metode || 'tunai';
      }
      if (catatan !== undefined) {
        updateData.catatan = catatan || null;
      }

      await db.pembayaranIuranArisan.update({
        where: { id: pembayaranId },
        data: updateData,
      });
    }

    // Get current putaran details
    const putaran = await db.putaranArisan.findUnique({
      where: { id: putaranId },
      include: {
        kelompok: {
          include: { peserta: true },
        },
      },
    });

    if (!putaran) {
      return NextResponse.json(
        { success: false, error: 'Putaran arisan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Recalculate totalTerkumpul
    const allPaid = await db.pembayaranIuranArisan.findMany({
      where: { putaranId, statusBayar: true },
      select: { nominal: true },
    });

    const totalTarget = putaran.totalTarget || (putaran.kelompok.peserta.length * putaran.kelompok.nominalIuran);
    const totalTerkumpul = allPaid.reduce((acc, curr) => acc + curr.nominal, 0);
    const nominalKurang = Math.max(0, totalTarget - totalTerkumpul);

    const finalDiserahkan = totalTerkumpul;
    const nominalTalangan = 0;
    const currentTalangan = 'tidak_ditalangi';

    const updatedPutaran = await db.putaranArisan.update({
      where: { id: putaranId },
      data: {
        totalTarget,
        totalTerkumpul,
        nominalKurang,
        nominalDiserahkan: finalDiserahkan,
        nominalTalangan,
        nominalDiterima: finalDiserahkan,
        statusTalangan: currentTalangan,
      },
      include: {
        pembayaran: {
          include: { peserta: true },
          orderBy: { peserta: { namaPeserta: 'asc' } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Status kehadiran dan pembayaran iuran berhasil diperbarui',
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

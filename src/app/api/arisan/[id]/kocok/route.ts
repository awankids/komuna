import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWeton, findNextWetonDate } from '@/lib/javanese-date';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kelompokId } = await params;
    const body = await request.json();
    const {
      pemenangId,
      tanggalKocok = new Date().toISOString(),
      hariJawa,
      agendaId,
      statusTalangan = 'tidak_ditalangi', // "tidak_ditalangi" | "ditalangi_kas"
      nominalDiserahkan: customDiserahkan,
      catatan,
      dicatatOleh = 'Pengurus RT',
      kehadiranDanIuranList = [], // Array of { pesertaId, statusKehadiran, statusBayar, metode, catatan }
      sinkronAgendaBerikutnya = true,
      lokasiBerikutnya,
      tanggalBerikutnya,
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
        peserta: {
          include: {
            anggota: true,
          },
        },
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

    // Determine Hari Jawa (Weton)
    const computedWeton = getWeton(new Date(tanggalKocok));
    const finalHariJawa =
      hariJawa?.trim() ||
      kelompok.hariJawa ||
      `${computedWeton.malamWeton} (${computedWeton.wetonMasehi})`;

    // Calculate Finances
    const totalTarget = kelompok.peserta.length * kelompok.nominalIuran;

    // Map presence and payments
    const detailMap = new Map<
      string,
      {
        statusKehadiran: string;
        statusBayar: boolean;
        metode: string;
        catatan?: string;
      }
    >();

    if (Array.isArray(kehadiranDanIuranList)) {
      kehadiranDanIuranList.forEach((item: any) => {
        if (item.pesertaId) {
          detailMap.set(item.pesertaId, {
            statusKehadiran: item.statusKehadiran || 'hadir',
            statusBayar: Boolean(item.statusBayar),
            metode: item.metode || 'tunai',
            catatan: item.catatan || null,
          });
        }
      });
    }

    let totalTerkumpul = 0;
    const pembayaranRows = kelompok.peserta.map((p) => {
      const detail = detailMap.get(p.id) || {
        statusKehadiran: 'hadir',
        statusBayar: false,
        metode: 'tunai',
        catatan: undefined,
      };

      if (detail.statusBayar) {
        totalTerkumpul += kelompok.nominalIuran;
      }

      return {
        pesertaId: p.id,
        statusKehadiran: detail.statusKehadiran,
        statusBayar: detail.statusBayar,
        tanggalBayar: detail.statusBayar ? new Date(tanggalKocok) : null,
        nominal: kelompok.nominalIuran,
        metode: detail.metode,
        catatan: detail.catatan || null,
      };
    });

    const nominalKurang = Math.max(0, totalTarget - totalTerkumpul);
    const finalDiserahkan = totalTerkumpul;
    const nominalTalangan = 0;
    const finalStatusTalangan = 'tidak_ditalangi';

    // Execute in Prisma transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Mark winner as won
      await tx.pesertaArisan.update({
        where: { id: pemenangId },
        data: {
          sudahMenang: true,
          tanggalMenang: new Date(tanggalKocok),
        },
      });

      // 2. Create PutaranArisan with detailed finance and agenda linkage
      const newPutaran = await tx.putaranArisan.create({
        data: {
          kelompokId,
          putaranKe: nextPutaranKe,
          tanggalKocok: new Date(tanggalKocok),
          hariJawa: finalHariJawa,
          agendaId: agendaId || null,
          totalTarget,
          totalTerkumpul,
          nominalDiserahkan: finalDiserahkan,
          nominalKurang,
          statusTalangan: finalStatusTalangan,
          nominalTalangan,
          pemenangId,
          namaPemenang: pemenang.namaPeserta,
          nominalDiterima: finalDiserahkan,
          status: 'terlaksana',
          catatan: catatan?.trim() || null,
          dicatatOleh,
        },
      });

      // 3. Batch create PembayaranIuranArisan
      const rowsWithPutaranId = pembayaranRows.map((r) => ({
        ...r,
        putaranId: newPutaran.id,
      }));

      await tx.pembayaranIuranArisan.createMany({
        data: rowsWithPutaranId,
      });

      // 4. Update existing agenda if linked to completed
      if (agendaId) {
        await tx.agenda.update({
          where: { id: agendaId },
          data: { status: 'selesai' },
        });
      }

      // 5. Automatically schedule next round agenda with WINNER as the next host
      const winnerHouse = pemenang.anggota?.noRumah
        ? `Rumah Bpk/Ibu ${pemenang.namaPeserta} (No. ${pemenang.anggota.noRumah})`
        : `Rumah Bpk/Ibu ${pemenang.namaPeserta}`;
      const finalNextLocation = (lokasiBerikutnya && lokasiBerikutnya.trim()) || winnerHouse;

      // Update current group meeting location to the new winner's house for upcoming round
      await tx.kelompokArisan.update({
        where: { id: kelompokId },
        data: { lokasiKocok: finalNextLocation },
      });

      if (sinkronAgendaBerikutnya) {
        try {
          let nextAgendaDate: Date;
          if (tanggalBerikutnya) {
            nextAgendaDate = new Date(tanggalBerikutnya);
          } else if (kelompok.hariJawa) {
            nextAgendaDate = findNextWetonDate(
              kelompok.hariJawa,
              new Date(new Date(tanggalKocok).getTime() + 86400000 * 2) // from 2 days after current
            );
          } else {
            nextAgendaDate = new Date(new Date(tanggalKocok).getTime() + 86400000 * 30);
          }

          await tx.agenda.create({
            data: {
              judul: `Rapat Rutin & Kocokan Arisan: ${kelompok.nama} (#${nextPutaranKe + 1})`,
              kategori: 'rapat',
              tanggal: nextAgendaDate,
              waktuMulai: kelompok.waktuKocok || '19:30',
              lokasi: finalNextLocation,
              keterangan: `Pertemuan rutin arisan putaran ke-${nextPutaranKe + 1} (${kelompok.hariJawa || 'Bulanan'}). Tuan Rumah: Bpk/Ibu ${pemenang.namaPeserta}.`,
              status: 'terjadwal',
            },
          });
        } catch (agendaErr) {
          console.warn('Gagal sinkron agenda berikutnya:', agendaErr);
        }
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

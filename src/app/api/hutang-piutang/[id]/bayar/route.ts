import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenantContext } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const tenant = await requireTenantContext();
    const { id } = await context.params;
    const body = await request.json();
    const {
      nominalBayar,
      tanggalBayar = new Date().toISOString(),
      metode = 'tunai',
      catatan,
      dicatatOleh = 'Admin RT',
      catatDiKas = true,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const bayarInt = parseInt(nominalBayar, 10);
    if (isNaN(bayarInt) || bayarInt <= 0) {
      return NextResponse.json(
        { error: 'Nominal pembayaran harus berupa angka lebih dari 0' },
        { status: 400 }
      );
    }

    // Atomic transaction for payment + cash ledger sync
    const result = await db.$transaction(async (tx) => {
      const hutangPiutang = await tx.hutangPiutang.findFirst({
        where: { id, komunitasId: tenant.komunitasId },
      });

      if (!hutangPiutang) {
        throw new Error('NOT_FOUND');
      }

      if (hutangPiutang.status === 'lunas' || hutangPiutang.sisaNominal <= 0) {
        throw new Error('ALREADY_SETTLED');
      }

      if (bayarInt > hutangPiutang.sisaNominal) {
        throw new Error('EXCEEDS_REMAINING');
      }

      const sisaSebelumnya = hutangPiutang.sisaNominal;
      const sisaSetelahnya = sisaSebelumnya - bayarInt;
      const newStatus = sisaSetelahnya === 0 ? 'lunas' : 'sebagian';
      const payDate = new Date(tanggalBayar);

      let transaksiKasId: string | null = null;

      // Automatically sync with TransaksiKeuangan (Kas RT) if enabled
      if (catatDiKas) {
        if (hutangPiutang.tipe === 'piutang') {
          // Uang masuk ke kas RT dari pelunasan/cicilan piutang
          const kasTx = await tx.transaksiKeuangan.create({
            data: {
              komunitasId: tenant.komunitasId,
              tanggal: payDate,
              jenis: 'pemasukan',
              sumber: 'manual',
              kategori: 'Pelunasan Piutang',
              keterangan: `Pelunasan Piutang: ${hutangPiutang.judul} (${hutangPiutang.namaPihak})`,
              nominal: bayarInt,
            },
          });
          transaksiKasId = kasTx.id;
        } else if (hutangPiutang.tipe === 'hutang') {
          // Uang kas RT keluar untuk membayar hutang vendor
          const kasTx = await tx.transaksiKeuangan.create({
            data: {
              komunitasId: tenant.komunitasId,
              tanggal: payDate,
              jenis: 'pengeluaran',
              sumber: 'manual',
              kategori: 'Pembayaran Hutang',
              keterangan: `Pembayaran Hutang: ${hutangPiutang.judul} (${hutangPiutang.namaPihak})`,
              nominal: bayarInt,
            },
          });
          transaksiKasId = kasTx.id;
        }
      }

      // Record payment history
      const pembayaran = await tx.pembayaranHutangPiutang.create({
        data: {
          hutangPiutangId: id,
          tanggalBayar: payDate,
          nominalBayar: bayarInt,
          sisaSebelumnya,
          sisaSetelahnya,
          metode,
          catatan: catatan ? catatan.trim() : null,
          dicatatOleh,
          transaksiKasId,
        },
      });

      // Update parent HutangPiutang record
      const updatedHutangPiutang = await tx.hutangPiutang.update({
        where: { id },
        data: {
          sisaNominal: sisaSetelahnya,
          status: newStatus,
        },
        include: {
          anggota: true,
          riwayatBayar: {
            orderBy: { tanggalBayar: 'desc' },
          },
        },
      });

      // Send System Notification
      const labelTipe = hutangPiutang.tipe === 'piutang' ? 'Piutang' : 'Hutang';
      const statusKet = newStatus === 'lunas' ? 'Lunas Sepenuhnya' : `Sisa Rp ${sisaSetelahnya.toLocaleString('id-ID')}`;
      await tx.notifikasi.create({
        data: {
          title: `Pembayaran ${labelTipe}: ${hutangPiutang.judul}`,
          message: `Pembayaran sebesar Rp ${bayarInt.toLocaleString('id-ID')} (${metode.toUpperCase()}) telah dicatat oleh ${dicatatOleh}. Status: ${statusKet}.`,
          type: newStatus === 'lunas' ? 'success' : 'info',
        },
      });

      return {
        pembayaran,
        hutangPiutang: updatedHutangPiutang,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);

    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }
    if (error.message === 'ALREADY_SETTLED') {
      return NextResponse.json({ error: 'Data ini sudah lunas sepenuhnya' }, { status: 400 });
    }
    if (error.message === 'EXCEEDS_REMAINING') {
      return NextResponse.json(
        { error: 'Nominal pembayaran tidak boleh melebihi sisa tagihan/pinjaman' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal memproses pembayaran cicilan' },
      { status: 500 }
    );
  }
}

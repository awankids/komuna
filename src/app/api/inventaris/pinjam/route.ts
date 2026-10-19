import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenantContext } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { 
      inventarisId, 
      namaPeminjam, 
      noRumah, 
      kontakPeminjam, 
      jumlahPinjam, 
      keperluan, 
      tanggalPinjam,
      action, // 'pinjam' | 'kembalikan'
      peminjamanId,
      catatanKondisi
    } = body;

    // Action: Kembalikan Barang
    if (action === 'kembalikan' && peminjamanId) {
      const pinjamRecord = await db.peminjamanAset.findFirst({
        where: { id: peminjamanId },
        include: { inventaris: true }
      });
      if (!pinjamRecord || pinjamRecord.inventaris.komunitasId !== tenant.komunitasId) {
        return NextResponse.json({ error: 'Data peminjaman tidak ditemukan di komunitas Anda' }, { status: 404 });
      }

      const updated = await db.peminjamanAset.update({
        where: { id: peminjamanId },
        data: {
          status: 'dikembalikan',
          tanggalKembali: new Date(),
          catatanKondisi: catatanKondisi || 'Dikembalikan dalam kondisi baik'
        }
      });
      return NextResponse.json({ success: true, data: updated, message: 'Barang berhasil dikembalikan' });
    }

    // Action: Pinjam Barang Baru
    if (!inventarisId || !namaPeminjam || !keperluan) {
      return NextResponse.json({ error: 'Data peminjaman tidak lengkap (Barang, Nama, Keperluan wajib diisi)' }, { status: 400 });
    }

    // Verify inventaris belongs to this tenant
    const inv = await db.inventarisAset.findFirst({
      where: { id: inventarisId, komunitasId: tenant.komunitasId }
    });
    if (!inv) {
      return NextResponse.json({ error: 'Barang inventaris tidak ditemukan di komunitas Anda' }, { status: 404 });
    }

    const pinjam = await db.peminjamanAset.create({
      data: {
        inventarisId,
        namaPeminjam,
        noRumah: noRumah || null,
        kontakPeminjam: kontakPeminjam || null,
        jumlahPinjam: Number(jumlahPinjam) || 1,
        keperluan,
        tanggalPinjam: tanggalPinjam ? new Date(tanggalPinjam) : new Date(),
        status: 'dipinjam',
        catatanKondisi: catatanKondisi || null
      }
    });

    return NextResponse.json({ success: true, data: pinjam, message: 'Peminjaman berhasil dicatat' }, { status: 201 });
  } catch (error: any) {
    console.error('Error handling peminjaman:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses peminjaman' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID peminjaman wajib disertakan' }, { status: 400 });
    }

    const pinjamRecord = await db.peminjamanAset.findFirst({
      where: { id },
      include: { inventaris: true }
    });
    if (!pinjamRecord || pinjamRecord.inventaris.komunitasId !== tenant.komunitasId) {
      return NextResponse.json({ error: 'Catatan peminjaman tidak ditemukan di komunitas Anda' }, { status: 404 });
    }

    await db.peminjamanAset.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Catatan peminjaman berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting peminjaman:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus peminjaman' }, { status: 500 });
  }
}

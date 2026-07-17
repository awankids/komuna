import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [users, rombongan, anggota, jadwal, jimpitan, transaksi] = await Promise.all([
      db.user.count(),
      db.rombongan.count(),
      db.anggota.count(),
      db.jadwalPetugas.count(),
      db.jimpitan.count(),
      db.transaksiKeuangan.count(),
    ]);

    return NextResponse.json({
      users,
      rombongan,
      anggota,
      jadwal,
      jimpitan,
      transaksi,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil stats database' }, { status: 500 });
  }
}

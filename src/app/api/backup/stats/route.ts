import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

export async function GET() {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const [users, rombongan, anggota, jadwal, jimpitan, transaksi] = await Promise.all([
      db.user.count({ where: { komunitasId: tenant.komunitasId } }),
      db.rombongan.count({ where: { komunitasId: tenant.komunitasId } }),
      db.anggota.count({ where: { komunitasId: tenant.komunitasId } }),
      db.jadwalPetugas.count({ where: { anggota: { komunitasId: tenant.komunitasId } } }),
      db.jimpitan.count({ where: { komunitasId: tenant.komunitasId } }),
      db.transaksiKeuangan.count({ where: { komunitasId: tenant.komunitasId } }),
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

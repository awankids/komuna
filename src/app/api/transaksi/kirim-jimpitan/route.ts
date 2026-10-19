import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenantContext } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json({ error: 'Bulan dan Tahun wajib diisi' }, { status: 400 });
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10) - 1; // 0-indexed for JS Date

    // 1. Check if the month has ended relative to today
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    if (yearNum > currentYear || (yearNum === currentYear && monthNum >= currentMonth)) {
      return NextResponse.json({ error: 'Bulan terpilih belum berakhir. Data jimpitan hanya dapat dikirim setelah bulan selesai.' }, { status: 400 });
    }

    // 2. Check if a jimpitan transaction for this month already exists in TransaksiKeuangan
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum + 1, 0, 23, 59, 59, 999));

    const existingTx = await db.transaksiKeuangan.findFirst({
      where: {
        komunitasId: tenant.komunitasId,
        sumber: 'jimpitan',
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    if (existingTx) {
      return NextResponse.json({ error: 'Data jimpitan bulan ini sudah pernah dikirim ke Kas RT.' }, { status: 400 });
    }

    // 3. Query all jimpitan records for this month and sum nominals
    const jimpitanRecords = await db.jimpitan.findMany({
      where: {
        komunitasId: tenant.komunitasId,
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const totalJimpitan = jimpitanRecords.reduce((sum, j) => sum + j.nominal, 0);

    if (totalJimpitan <= 0) {
      return NextResponse.json({ error: 'Tidak ada data jimpitan (nominal > 0) untuk dikirim pada bulan ini.' }, { status: 400 });
    }

    // 4. Create transaction in TransaksiKeuangan
    const newTx = await db.transaksiKeuangan.create({
      data: {
        tanggal: endOfMonth,
        jenis: 'pemasukan',
        sumber: 'jimpitan',
        kategori: 'Jimpitan',
        keterangan: `Jimpitan Bulan ${getMonthName(month)} ${year}`,
        nominal: totalJimpitan,
        komunitasId: tenant.komunitasId,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengirim jimpitan bulan ${getMonthName(month)} ${year} sebesar ${totalJimpitan} ke Kas RT.`,
      transaction: newTx
    });
  } catch (error: any) {
    console.error('Error sending jimpitan to cash:', error);
    return NextResponse.json({ error: 'Gagal mengirim data jimpitan ke Kas RT: ' + error.message }, { status: 500 });
  }
}

function getMonthName(monthStr: string) {
  const names: { [key: string]: string } = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };
  return names[monthStr] || 'Juli';
}

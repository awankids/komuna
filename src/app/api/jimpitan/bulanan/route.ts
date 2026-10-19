import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Bulan dan Tahun wajib diisi' }, { status: 400 });
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10) - 1; // 0-indexed for JS Date

    // Calculate dates
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0));
    const lastDay = new Date(yearNum, monthNum + 1, 0).getDate();
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum, lastDay, 23, 59, 59, 999));

    // Fetch schedules in the month range for this tenant
    const schedules = await db.jadwalPetugas.findMany({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        anggota: {
          komunitasId: tenant.komunitasId,
        }
      },
      include: {
        anggota: true,
      },
      orderBy: { tanggal: 'asc' },
    });

    // Fetch jimpitan inputs in the month range for this tenant
    const jimpitan = await db.jimpitan.findMany({
      where: {
        komunitasId: tenant.komunitasId,
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    // Check if jimpitan of this month has already been sent to Kas RT
    const monthlyKasSent = await db.transaksiKeuangan.findFirst({
      where: {
        komunitasId: tenant.komunitasId,
        sumber: 'jimpitan',
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    return NextResponse.json({
      schedules,
      jimpitan,
      isSent: !!monthlyKasSent
    });
  } catch (error: any) {
    console.error('Error fetching monthly jimpitan details:', error);
    return NextResponse.json({ error: 'Gagal mengambil data bulanan' }, { status: 500 });
  }
}

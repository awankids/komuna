import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Verify Authorization
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    // We allow either Authorization header or ?token= query parameter
    const secret = process.env.CRON_SECRET || 'komuna-secret-cron-key-2026';
    
    if (authHeader !== `Bearer ${secret}` && token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get current day of the week (1 = Monday, 7 = Sunday)
    // Convert current time to WIB (Asia/Jakarta)
    const wibDateString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const wibDate = new Date(wibDateString);
    let dayOfWeek = wibDate.getDay();
    let hariPiket = dayOfWeek === 0 ? 7 : dayOfWeek; // 1: Mon, 7: Sun

    // 3. Find the Rombongan scheduled for today
    const rombongan = await prisma.rombongan.findFirst({
      where: {
        hariPiket: hariPiket
      },
      include: {
        anggota: true
      }
    });

    if (!rombongan) {
      return NextResponse.json({ 
        success: true, 
        message: `No rombongan scheduled for day ${hariPiket}` 
      });
    }

    // 4. Create Notification
    const title = 'Persiapan Jimpitan 🕒';
    const message = `Halo, pengingat bahwa **${rombongan.nama}** dijadwalkan untuk keliling mengambil jimpitan hari ini. Semangat bertugas!`;

    const notifikasi = await prisma.notifikasi.create({
      data: {
        title,
        message,
        type: 'info',
        isRead: false,
        komunitasId: rombongan.komunitasId,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Notification created successfully',
      notifikasi 
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

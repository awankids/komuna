import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';
import { checkAndTriggerJimpitanStreakAlert } from '@/lib/jimpitan-streak';

export async function GET() {
  try {
    const tenant = await getTenantContext();

    // Check 3-day jimpitan streak in the background for logged-in tenant
    if (tenant?.komunitasId) {
      await checkAndTriggerJimpitanStreakAlert(tenant.komunitasId).catch(err => {
        console.error('Streak check error:', err);
      });
    }

    const whereClause = tenant?.komunitasId
      ? {
          OR: [
            { komunitasId: tenant.komunitasId }, // Notifikasi RT spesifik
            { komunitasId: null },               // Notifikasi pembaruan sistem global
          ],
        }
      : {
          komunitasId: null, // Tamu / unauthenticated hanya melihat changelog publik
        };

    const notifikasi = await db.notifikasi.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 25, // Limit to recent 25
    });
    
    return NextResponse.json({ success: true, notifikasi });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Gagal memuat notifikasi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    const data = await request.json();
    
    const notifikasi = await db.notifikasi.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        komunitasId: tenant?.komunitasId || null,
      }
    });
    
    return NextResponse.json({ success: true, notifikasi });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Gagal membuat notifikasi' }, { status: 500 });
  }
}

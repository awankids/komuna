import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';

export async function PUT() {
  try {
    const tenant = await getTenantContext();

    const whereClause = tenant?.komunitasId
      ? {
          isRead: false,
          OR: [
            { komunitasId: tenant.komunitasId },
            { komunitasId: null },
          ],
        }
      : {
          isRead: false,
          komunitasId: null,
        };

    const result = await db.notifikasi.updateMany({
      where: whereClause,
      data: {
        isRead: true,
      },
    });
    
    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Gagal memperbarui notifikasi' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT() {
  try {
    const result = await db.notifikasi.updateMany({
      where: {
        isRead: false,
      },
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

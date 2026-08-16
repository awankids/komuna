import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updatedNotif = await db.notifikasi.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(updatedNotif);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

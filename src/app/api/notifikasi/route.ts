import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const notifikasi = await db.notifikasi.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Limit to recent 20
    });
    
    return NextResponse.json({ success: true, notifikasi });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Gagal memuat notifikasi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const notifikasi = await db.notifikasi.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'info',
      }
    });
    
    return NextResponse.json({ success: true, notifikasi });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Gagal membuat notifikasi' }, { status: 500 });
  }
}

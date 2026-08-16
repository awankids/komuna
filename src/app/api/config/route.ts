import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const config = await db.pengaturanAplikasi.findFirst();
    
    // Default values if no record exists
    if (!config) {
      return NextResponse.json({
        namaApp: 'komuna.id',
        namaRt: 'RT 04',
        tagline: 'Kebersamaan, Terpadu, Transparan'
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch AppConfig:', error);
    return NextResponse.json({ 
      namaApp: 'komuna.id',
      namaRt: 'RT 04',
      tagline: 'Kebersamaan, Terpadu, Transparan'
    }, { status: 200 }); // Graceful fallback
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { namaApp, namaRt, tagline } = body;

    if (!namaApp || !namaRt || !tagline) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Check if config exists
    const existing = await db.pengaturanAplikasi.findFirst();
    let config;

    if (existing) {
      config = await db.pengaturanAplikasi.update({
        where: { id: existing.id },
        data: { namaApp, namaRt, tagline }
      });
    } else {
      config = await db.pengaturanAplikasi.create({
        data: { namaApp, namaRt, tagline }
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to update AppConfig:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan aplikasi' }, { status: 500 });
  }
}

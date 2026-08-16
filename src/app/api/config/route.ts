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
        tagline: 'Kebersamaan, Terpadu, Transparan',
        targetJimpitan: 3000000
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch AppConfig:', error);
    return NextResponse.json({ 
      namaApp: 'komuna.id',
      namaRt: 'RT 04',
      tagline: 'Kebersamaan, Terpadu, Transparan',
      targetJimpitan: 3000000
    }, { status: 200 }); // Graceful fallback
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { namaApp, namaRt, tagline, targetJimpitan } = body;

    // Remove the strict requirement for ALL fields, only validate those provided. 
    // Wait, the existing code requires all 3. Let's keep it requiring all 3.
    if (!namaApp || !namaRt || !tagline) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Check if config exists
    const existing = await db.pengaturanAplikasi.findFirst();
    let config;

    // Use existing target if not provided in PUT
    const target = targetJimpitan !== undefined ? parseInt(targetJimpitan, 10) : (existing?.targetJimpitan || 3000000);

    if (existing) {
      config = await db.pengaturanAplikasi.update({
        where: { id: existing.id },
        data: { namaApp, namaRt, tagline, targetJimpitan: target }
      });
    } else {
      config = await db.pengaturanAplikasi.create({
        data: { namaApp, namaRt, tagline, targetJimpitan: target }
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to update AppConfig:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan aplikasi' }, { status: 500 });
  }
}

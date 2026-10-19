import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

export async function GET() {
  try {
    const tenant = await getTenantContext();
    let config = null;

    if (tenant?.komunitasId) {
      config = await db.pengaturanAplikasi.findFirst({
        where: { komunitasId: tenant.komunitasId }
      });

      if (!config) {
        const kom = await db.komunitas.findUnique({
          where: { id: tenant.komunitasId }
        });
        if (kom) {
          return NextResponse.json({
            namaApp: 'komuna.id',
            namaRt: kom.nama || 'RT',
            tagline: 'Kebersamaan, Terpadu, Transparan',
            targetJimpitan: kom.targetJimpitan || 3000000,
            kotaWilayah: kom.kotaKabupaten || 'Indonesia',
            nomorSk: '',
            periodeAktif: '2024 - 2029',
            komunitasId: kom.id,
          });
        }
      }
    } else {
      // Default fallback
      config = await db.pengaturanAplikasi.findFirst();
    }
    
    // Default values if no record exists
    if (!config) {
      return NextResponse.json({
        namaApp: 'komuna.id',
        namaRt: 'RT',
        tagline: 'Kebersamaan, Terpadu, Transparan',
        targetJimpitan: 3000000,
        kotaWilayah: 'Semarang',
        nomorSk: '',
        periodeAktif: '2024 - 2029',
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to fetch AppConfig:', error);
    return NextResponse.json({ 
      namaApp: 'komuna.id',
      namaRt: 'RT',
      tagline: 'Kebersamaan, Terpadu, Transparan',
      targetJimpitan: 3000000,
      kotaWilayah: 'Semarang',
      nomorSk: '',
      periodeAktif: '2024 - 2029',
    }, { status: 200 }); // Graceful fallback
  }
}

export async function PUT(request: Request) {
  try {
    const tenant = await requireTenantContext();
    const body = await request.json();
    const { namaApp, namaRt, tagline, targetJimpitan, kotaWilayah, nomorSk, periodeAktif } = body;

    if (!namaApp || !namaRt || !tagline) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Check if config exists for this tenant
    const existing = await db.pengaturanAplikasi.findFirst({
      where: { komunitasId: tenant.komunitasId }
    });
    let config;

    // Use existing target if not provided in PUT
    const target = targetJimpitan !== undefined ? parseInt(targetJimpitan, 10) : (existing?.targetJimpitan || 3000000);
    const kota = kotaWilayah !== undefined ? kotaWilayah : (existing?.kotaWilayah || 'Semarang');
    const sk = nomorSk !== undefined ? nomorSk : (existing?.nomorSk || '');
    const periode = periodeAktif !== undefined ? periodeAktif : (existing?.periodeAktif || '2024 - 2029');

    if (existing) {
      config = await db.pengaturanAplikasi.update({
        where: { id: existing.id },
        data: { 
          namaApp, 
          namaRt, 
          tagline, 
          targetJimpitan: target,
          kotaWilayah: kota,
          nomorSk: sk,
          periodeAktif: periode
        }
      });
    } else {
      config = await db.pengaturanAplikasi.create({
        data: { 
          namaApp, 
          namaRt, 
          tagline, 
          targetJimpitan: target,
          kotaWilayah: kota,
          nomorSk: sk,
          periodeAktif: periode,
          komunitasId: tenant.komunitasId,
        }
      });
    }

    // Also update targetJimpitan on Komunitas record if present
    await db.komunitas.update({
      where: { id: tenant.komunitasId },
      data: { targetJimpitan: target }
    }).catch(() => {});

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Failed to update AppConfig:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan aplikasi' }, { status: 500 });
  }
}

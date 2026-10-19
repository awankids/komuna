import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookies, hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const demoEmail = 'demo@komuna.id';
    
    // 1. Get demo-sandbox Komunitas
    let demoKomunitas = await db.komunitas.findFirst({
      where: { slug: 'demo-sandbox' },
    });

    if (!demoKomunitas) {
      demoKomunitas = await db.komunitas.create({
        data: {
          nama: 'RT 04 Sukamaju (Simulasi Demo)',
          slug: 'demo-sandbox',
          tingkatWilayah: 'RT',
          noRt: '04',
          noRw: '02',
          dusunPerumahan: 'Kampung Sukamaju',
          desaKelurahan: 'Sukamaju',
          kecamatan: 'Cilodong',
          kotaKabupaten: 'Kota Depok',
          provinsi: 'Jawa Barat',
          targetJimpitan: 3000000,
          temaWarna: 'orange',
          modulAktif: 'jimpitan,kas,anggota,arisan,surat,inventaris',
        },
      });
    }

    // 2. Get or create demo user under demo-sandbox
    let user = await db.user.findUnique({
      where: { email: demoEmail },
      include: { komunitas: true },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          nama: 'Pengurus Demo (Simulasi Sukamaju)',
          email: demoEmail,
          noHp: '081200000000',
          passwordHash: hashPassword('demokomuna123'),
          role: 'ADMIN',
          jabatan: 'Ketua RT (Demo)',
          statusAktif: true,
          komunitasId: demoKomunitas.id,
        },
        include: { komunitas: true },
      });
    } else if (user.komunitasId !== demoKomunitas.id) {
      // Re-bind to demo sandbox if it was pointing to any other komunitas
      user = await db.user.update({
        where: { id: user.id },
        data: { komunitasId: demoKomunitas.id },
        include: { komunitas: true },
      });
    }

    // 3. Set active session cookies
    await setSessionCookies({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      komunitasId: demoKomunitas.id,
      komunitasNama: demoKomunitas.nama,
      jabatan: user.jabatan || 'Ketua RT (Demo)',
    });

    // 3. Redirect smoothly to dashboard
    const url = new URL('/', request.url);
    url.searchParams.set('demo', '1');
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Demo login error:', error);
    const loginUrl = new URL('/login?error=demo_failed', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export async function POST(request: Request) {
  try {
    const demoEmail = 'demo@komuna.id';
    
    // 1. Get demo-sandbox Komunitas
    let demoKomunitas = await db.komunitas.findFirst({
      where: { slug: 'demo-sandbox' },
    });

    if (!demoKomunitas) {
      demoKomunitas = await db.komunitas.create({
        data: {
          nama: 'RT 04 Sukamaju (Simulasi Demo)',
          slug: 'demo-sandbox',
          tingkatWilayah: 'RT',
          noRt: '04',
          noRw: '02',
          dusunPerumahan: 'Kampung Sukamaju',
          desaKelurahan: 'Sukamaju',
          kecamatan: 'Cilodong',
          kotaKabupaten: 'Kota Depok',
          provinsi: 'Jawa Barat',
          targetJimpitan: 3000000,
          temaWarna: 'orange',
          modulAktif: 'jimpitan,kas,anggota,arisan,surat,inventaris',
        },
      });
    }

    let user = await db.user.findUnique({
      where: { email: demoEmail },
      include: { komunitas: true },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          nama: 'Pengurus Demo (Simulasi Sukamaju)',
          email: demoEmail,
          noHp: '081200000000',
          passwordHash: hashPassword('demokomuna123'),
          role: 'ADMIN',
          jabatan: 'Ketua RT (Demo)',
          statusAktif: true,
          komunitasId: demoKomunitas.id,
        },
        include: { komunitas: true },
      });
    } else if (user.komunitasId !== demoKomunitas.id) {
      user = await db.user.update({
        where: { id: user.id },
        data: { komunitasId: demoKomunitas.id },
        include: { komunitas: true },
      });
    }

    await setSessionCookies({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      komunitasId: demoKomunitas.id,
      komunitasNama: demoKomunitas.nama,
      jabatan: user.jabatan || 'Ketua RT (Demo)',
    });

    return NextResponse.json({
      success: true,
      message: 'Masuk mode demo berhasil',
      redirect: '/?demo=1',
    });
  } catch (error) {
    console.error('Demo POST login error:', error);
    return NextResponse.json({ error: 'Gagal mengaktifkan mode demo' }, { status: 500 });
  }
}

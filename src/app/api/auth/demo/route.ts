import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookies, hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const demoEmail = 'demo@komuna.id';
    
    // 1. Get or create demo user
    let user = await db.user.findUnique({
      where: { email: demoEmail },
      include: { komunitas: true },
    });

    if (!user) {
      // Find default komunitas or create one
      let defaultKomunitas = await db.komunitas.findFirst();
      if (!defaultKomunitas) {
        defaultKomunitas = await db.komunitas.create({
          data: {
            nama: 'RT 04 Dayu (Demo)',
            slug: 'demo-rt04',
            tingkatWilayah: 'RT',
            noRt: '04',
            dusunPerumahan: 'Dayu DK1',
            desaKelurahan: 'Sinduharjo',
            kecamatan: 'Ngaglik',
            kotaKabupaten: 'Kabupaten Sleman',
            provinsi: 'D.I. Yogyakarta',
            targetJimpitan: 3000000,
            temaWarna: 'orange',
            modulAktif: 'jimpitan,kas,anggota,arisan,surat,inventaris',
          },
        });
      }

      user = await db.user.create({
        data: {
          nama: 'Pengurus Demo (Simulasi RT)',
          email: demoEmail,
          noHp: '081200000000',
          passwordHash: hashPassword('demokomuna123'),
          role: 'ADMIN',
          jabatan: 'Ketua RT (Demo)',
          statusAktif: true,
          komunitasId: defaultKomunitas.id,
        },
        include: { komunitas: true },
      });
    }

    // 2. Set active session cookies
    await setSessionCookies({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      komunitasId: user.komunitasId,
      komunitasNama: user.komunitas?.nama || 'RT Dayu 02',
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
    
    let user = await db.user.findUnique({
      where: { email: demoEmail },
      include: { komunitas: true },
    });

    if (!user) {
      let defaultKomunitas = await db.komunitas.findFirst();
      if (!defaultKomunitas) {
        defaultKomunitas = await db.komunitas.create({
          data: {
            nama: 'RT 04 Dayu (Demo)',
            slug: 'demo-rt04',
            tingkatWilayah: 'RT',
            noRt: '04',
            dusunPerumahan: 'Dayu DK1',
            desaKelurahan: 'Sinduharjo',
            kecamatan: 'Ngaglik',
            kotaKabupaten: 'Kabupaten Sleman',
            provinsi: 'D.I. Yogyakarta',
            targetJimpitan: 3000000,
            temaWarna: 'orange',
            modulAktif: 'jimpitan,kas,anggota,arisan,surat,inventaris',
          },
        });
      }

      user = await db.user.create({
        data: {
          nama: 'Pengurus Demo (Simulasi RT)',
          email: demoEmail,
          noHp: '081200000000',
          passwordHash: hashPassword('demokomuna123'),
          role: 'ADMIN',
          jabatan: 'Ketua RT (Demo)',
          statusAktif: true,
          komunitasId: defaultKomunitas.id,
        },
        include: { komunitas: true },
      });
    }

    await setSessionCookies({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      komunitasId: user.komunitasId,
      komunitasNama: user.komunitas?.nama || 'RT Dayu 02',
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

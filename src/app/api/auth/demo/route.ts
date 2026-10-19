import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setSessionCookies, hashPassword } from '@/lib/auth';

const DEMO_EMAIL = 'demo@komuna.id';
const DEMO_SLUG = 'demo-sandbox';

async function bootstrapDemoSession() {
  // 1. Get or create demo-sandbox Komunitas
  let demoKomunitas = await db.komunitas.findFirst({
    where: { slug: DEMO_SLUG },
  });

  if (!demoKomunitas) {
    demoKomunitas = await db.komunitas.create({
      data: {
        nama: 'RT 04 Sukamaju (Simulasi Demo)',
        slug: DEMO_SLUG,
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

  // 2. Ensure PengaturanAplikasi exists for demo-sandbox
  const existingConfig = await db.pengaturanAplikasi.findFirst({
    where: { komunitasId: demoKomunitas.id },
  });

  if (!existingConfig) {
    await db.pengaturanAplikasi.create({
      data: {
        komunitasId: demoKomunitas.id,
        namaApp: 'komuna.id',
        namaRt: demoKomunitas.nama,
        tagline: 'Kebersamaan, Terpadu, Transparan',
        targetJimpitan: 3000000,
        kotaWilayah: 'Kota Depok',
        nomorSk: 'SK.04/RW.02/SKM/2026',
        periodeAktif: '2025 - 2030',
      },
    });
  }

  // 3. Get or create demo user under demo-sandbox
  let user = await db.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { komunitas: true },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        nama: 'Pengurus Demo (Simulasi Sukamaju)',
        email: DEMO_EMAIL,
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

  // 4. Set active session cookies
  await setSessionCookies({
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    komunitasId: demoKomunitas.id,
    komunitasNama: demoKomunitas.nama,
    jabatan: user.jabatan || 'Ketua RT (Demo)',
  });

  return { user, demoKomunitas };
}

export async function GET(request: Request) {
  try {
    await bootstrapDemoSession();
    const url = new URL('/', request.url);
    url.searchParams.set('demo', '1');
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Demo GET login error:', error);
    const loginUrl = new URL('/login?error=demo_failed', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export async function POST() {
  try {
    await bootstrapDemoSession();
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
